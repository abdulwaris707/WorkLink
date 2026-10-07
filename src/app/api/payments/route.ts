import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { processPaymentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = user.role === "WORKER" 
      ? eq(schema.payments.workerId, user.id) 
      : eq(schema.payments.clientId, user.id);

    const payments = await db.query.payments.findMany({
      where,
      orderBy: [desc(schema.payments.createdAt)],
      with: {
        booking: {
          with: {
            service: true,
          },
        },
        client: {
          columns: { id: true, name: true, email: true },
        },
        worker: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can process payments" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = processPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment details", details: parsed.error.format() }, { status: 400 });
    }

    const { bookingId, cardNumber } = parsed.data;

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
      with: { service: true, worker: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "This booking has already been paid" }, { status: 400 });
    }

    const cleanCard = (cardNumber || "").replace(/\s+/g, "");
    if (cleanCard.length < 13 && cleanCard !== "4242424242424242") {
      return NextResponse.json({ error: "Please enter a valid card number (or use test 4242...)" }, { status: 400 });
    }

    const providerPaymentId = `ch_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const [payment] = await db
      .insert(schema.payments)
      .values({
        bookingId: booking.id,
        clientId: user.id,
        workerId: booking.workerId,
        amount: booking.quotedPrice,
        currency: "USD",
        provider: "stripe_test",
        providerPaymentId,
        status: "PAID",
      })
      .returning();

    await db
      .update(schema.bookings)
      .set({ paymentStatus: "PAID", updatedAt: new Date() })
      .where(eq(schema.bookings.id, booking.id));

    // Send notification to worker
    await db.insert(schema.notifications).values({
      userId: booking.workerId,
      title: "Payment Received",
      message: `${user.name} paid $${booking.quotedPrice} for "${booking.service.title}".`,
      type: "PAYMENT_UPDATE",
      link: "/worker/earnings",
    });

    // Log booking activity
    await db.insert(schema.bookingActivity).values({
      bookingId: booking.id,
      actorId: user.id,
      action: "PAYMENT_COMPLETED",
      details: `Payment of $${booking.quotedPrice} completed via stripe_test`,
    });

    const updatedBooking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, booking.id),
      with: { service: true, worker: true, payment: true },
    });

    return NextResponse.json({ success: true, payment, booking: updatedBooking });
  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed to process" }, { status: 500 });
  }
}
