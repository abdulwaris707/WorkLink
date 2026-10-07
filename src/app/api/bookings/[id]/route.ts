import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(1000).optional(),
  timeSlot: z.string().max(100).optional(),
  bookingDate: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, id),
      with: {
        service: true,
        client: true,
        worker: true,
        payment: true,
        review: true,
        activities: {
          with: {
            actor: true,
          },
          orderBy: [desc(schema.bookingActivity.createdAt)],
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Role authorization check
    const isClient = booking.clientId === user.id;
    const isWorker = booking.workerId === user.id;

    if (!isClient && !isWorker && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not have permission to view this booking." }, { status: 403 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Booking GET error:", error);
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 });
  }
}

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

    // Reschedule checks
    if ((bookingDate || timeSlot) && (isClient || isWorker)) {
      if (booking.status !== "PENDING" && booking.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: `Cannot reschedule a booking that is currently ${booking.status}.` },
          { status: 400 }
        );
      }

      if (bookingDate) {
        updateData.bookingDate = new Date(bookingDate);
      }
      if (timeSlot) {
        updateData.timeSlot = timeSlot;
      }

      const notifyTarget = isClient ? booking.workerId : booking.clientId;
      await db.insert(schema.notifications).values({
        userId: notifyTarget,
        title: "Booking Rescheduled",
        message: `${user.name} rescheduled "${booking.service.title}" to ${bookingDate ? new Date(bookingDate).toLocaleDateString() : ""} (${timeSlot || booking.timeSlot}).`,
        type: "BOOKING_RESCHEDULED",
        link: isClient ? "/worker/bookings" : "/client/bookings",
      });

      await db.insert(schema.bookingActivity).values({
        bookingId: booking.id,
        actorId: user.id,
        action: "RESCHEDULED",
        details: `Appointment rescheduled by ${user.name} to ${bookingDate || ""} ${timeSlot || ""}`,
      });
    }

    if (status) {
      // Validate status transition rules
      const allowedTransitions: Record<string, string[]> = {
        PENDING: ["ACCEPTED", "DECLINED", "CANCELLED"],
        ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        DECLINED: [],
        CANCELLED: [],
      };

      const validNextStates = allowedTransitions[booking.status] || [];
      if (!validNextStates.includes(status)) {
        return NextResponse.json(
          { error: `Invalid transition: Cannot change status from ${booking.status} to ${status}.` },
          { status: 400 }
        );
      }

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
      } else if (status === "IN_PROGRESS") {
        await db.insert(schema.notifications).values({
          userId: booking.clientId,
          title: "Work In Progress",
          message: `${booking.worker.name} has started work on "${booking.service.title}".`,
          type: "BOOKING_IN_PROGRESS",
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
          message: `The booking for "${booking.service.title}" was cancelled by ${user.name}.`,
          type: "BOOKING_CANCELLED",
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
