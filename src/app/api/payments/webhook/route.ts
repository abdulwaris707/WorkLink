import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getActivePaymentGateway } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature") || req.headers.get("x-webhook-signature") || "";
    const rawBody = await req.text();

    const gateway = getActivePaymentGateway();
    const result = await gateway.verifyWebhook(rawBody, signature);

    if (!result.verified) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    if (result.bookingId && result.status === "paid") {
      const booking = await db.query.bookings.findFirst({
        where: eq(schema.bookings.id, result.bookingId),
        with: { service: true, worker: true, client: true },
      });

      if (booking) {
        await db
          .update(schema.bookings)
          .set({ paymentStatus: "PAID", updatedAt: new Date() })
          .where(eq(schema.bookings.id, booking.id));

        await db.insert(schema.notifications).values({
          userId: booking.workerId,
          title: "Payment Confirmed via Webhook",
          message: `Payment of $${booking.quotedPrice} for "${booking.service.title}" has been confirmed.`,
          type: "PAYMENT_UPDATE",
          link: "/worker/earnings",
        });

        await db.insert(schema.bookingActivity).values({
          bookingId: booking.id,
          actorId: booking.clientId,
          action: "PAYMENT_CONFIRMED_WEBHOOK",
          details: `Webhook confirmed payment (${result.providerPaymentId})`,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
