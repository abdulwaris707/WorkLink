import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin, writeAdminAuditLog } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminBookingInterventionSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  reason: z.string().min(3).max(500),
});

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "ALL";

    const where = statusParam !== "ALL" ? eq(schema.bookings.status, statusParam as any) : undefined;

    const bookingsList = await db.query.bookings.findMany({
      where,
      orderBy: [desc(schema.bookings.createdAt)],
      limit: 100,
      with: {
        service: true,
        client: {
          columns: { id: true, name: true, email: true, phone: true },
        },
        worker: {
          columns: { id: true, name: true, email: true, phone: true },
        },
        payment: true,
        review: true,
        activities: {
          orderBy: [desc(schema.bookingActivity.createdAt)],
          with: {
            actor: { columns: { id: true, name: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({ bookings: bookingsList });
  } catch (error: any) {
    console.error("Admin bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await req.json();
    const parsed = adminBookingInterventionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { bookingId, status, reason } = parsed.data;

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
      with: { service: true, client: true, worker: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const previousStatus = booking.status;

    await db
      .update(schema.bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.bookings.id, bookingId));

    // Record booking activity
    await db.insert(schema.bookingActivity).values({
      bookingId,
      actorId: adminCheck.id,
      action: `ADMIN_STATUS_OVERRIDE_${status}`,
      details: `Status changed from ${previousStatus} to ${status} by Administrator. Note: ${reason}`,
    });

    // Write admin audit log
    await writeAdminAuditLog({
      adminId: adminCheck.id,
      action: "BOOKING_ADMIN_INTERVENTION",
      targetType: "BOOKING",
      targetId: bookingId,
      details: `Booking #${bookingId.slice(0, 8)} status changed from ${previousStatus} to ${status}. Note: ${reason}`,
      metadata: { previousStatus, nextStatus: status, reason },
      req,
    });

    // Notify both client and worker
    const message = `An administrator intervened on booking "${booking.service.title}". Status is now ${status}. Note: ${reason}`;
    await Promise.all([
      db.insert(schema.notifications).values({
        userId: booking.clientId,
        title: "Booking Admin Update",
        message,
        type: "REMINDER",
        link: "/client/bookings",
      }),
      db.insert(schema.notifications).values({
        userId: booking.workerId,
        title: "Booking Admin Update",
        message,
        type: "REMINDER",
        link: "/worker/bookings",
      }),
    ]);

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Admin bookings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
