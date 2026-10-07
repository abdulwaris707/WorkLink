import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = user.role === "WORKER" ? { workerId: user.id } : { clientId: user.id };

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            service: true,
          },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
        worker: {
          select: { id: true, name: true, email: true },
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
    const { bookingId, cardNumber, cardExpiry, cardCvc } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, worker: true },
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

    // In production without live Stripe secret keys, we validate mock test card format
    // e.g., 4242 4242 4242 4242
    const cleanCard = (cardNumber || "").replace(/\s+/g, "");
    if (cleanCard.length < 13 && cleanCard !== "4242424242424242") {
      return NextResponse.json({ error: "Please enter a valid card number (or use test 4242...)" }, { status: 400 });
    }

    const providerPaymentId = `ch_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Atomic transaction: create payment & update booking
    const [payment, updatedBooking] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId: booking.id,
          clientId: user.id,
          workerId: booking.workerId,
          amount: booking.quotedPrice,
          currency: "USD",
          provider: "stripe_test",
          providerPaymentId,
          status: "PAID",
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "PAID" },
      }),
    ]);

    // Send notification to worker
    await prisma.notification.create({
      data: {
        userId: booking.workerId,
        title: "Payment Received",
        message: `${user.name} paid $${booking.quotedPrice} for "${booking.service.title}".`,
        type: "PAYMENT_UPDATE",
        link: "/worker/earnings",
      },
    });

    return NextResponse.json({ success: true, payment, booking: updatedBooking });
  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed to process" }, { status: 500 });
  }
}
