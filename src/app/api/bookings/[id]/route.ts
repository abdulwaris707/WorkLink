import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(1000).optional(),
  timeSlot: z.string().max(100).optional(),
  bookingDate: z.string().datetime().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error.format() }, { status: 400 });
    }

    const { status, notes, timeSlot, bookingDate } = parsed.data;

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, id),
      with: {
        service: true,
        client: true,
        worker: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Role authorization check
    const isClient = booking.clientId === user.id;
    const isWorker = booking.workerId === user.id;

    if (!isClient && !isWorker && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Partial<typeof schema.bookings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (notes !== undefined && isWorker) {
      updateData.notes = notes;
    }

    if (bookingDate && (isClient || isWorker)) {
      updateData.bookingDate = new Date(bookingDate);
    }

    if (timeSlot && (isClient || isWorker)) {
      updateData.timeSlot = timeSlot;
    }

    if (status) {
      // Permission checks for status changes
      if (status === "ACCEPTED" || status === "DECLINED" || status === "IN_PROGRESS" || status === "COMPLETED") {
        if (!isWorker && user.role !== "ADMIN") {
          return NextResponse.json({ error: "Only the assigned worker can update this status" }, { status: 403 });
        }
      }

      if (status === "CANCELLED") {
        if (!isClient && !isWorker && user.role !== "ADMIN") {
          return NextResponse.json({ error: "Unauthorized to cancel booking" }, { status: 403 });
        }
      }

      updateData.status = status;

      // Handle notifications based on new status
      if (status === "ACCEPTED") {
        await db.insert(schema.notifications).values({
          userId: booking.clientId,
          title: "Booking Accepted!",
          message: `${booking.worker.name} accepted your request for "${booking.service.title}".`,
          type: "BOOKING_ACCEPTED",
          link: "/client/bookings",
        });
      } else if (status === "DECLINED") {
        await db.insert(schema.notifications).values({
          userId: booking.clientId,
          title: "Booking Declined",
          message: `${booking.worker.name} was unavailable for your requested time slot.`,
          type: "BOOKING_DECLINED",
          link: "/client/bookings",
        });
      } else if (status === "COMPLETED") {
        await db.insert(schema.notifications).values({
          userId: booking.clientId,
          title: "Job Marked Completed",
          message: `${booking.worker.name} completed "${booking.service.title}". Please leave a review!`,
          type: "BOOKING_COMPLETED",
          link: "/client/bookings",
        });
      } else if (status === "CANCELLED") {
        const notifyTarget = isClient ? booking.workerId : booking.clientId;
        await db.insert(schema.notifications).values({
          userId: notifyTarget,
          title: "Booking Cancelled",
          message: `The booking for "${booking.service.title}" has been cancelled.`,
          type: "REMINDER",
          link: isClient ? "/worker/bookings" : "/client/bookings",
        });
      }

      // Log booking activity
      await db.insert(schema.bookingActivity).values({
        bookingId: booking.id,
        actorId: user.id,
        action: `STATUS_CHANGED_TO_${status}`,
        details: `Booking status changed to ${status} by ${user.name} (${user.role})`,
      });
    }

    await db.update(schema.bookings).set(updateData).where(eq(schema.bookings.id, id));

    const updatedBooking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, id),
      with: {
        service: true,
        client: true,
        worker: true,
        payment: true,
        review: true,
      },
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
