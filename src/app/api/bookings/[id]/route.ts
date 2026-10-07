import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, notes, timeSlot, bookingDate } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
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

    const updateData: any = {};

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
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            title: "Booking Accepted!",
            message: `${booking.worker.name} accepted your request for "${booking.service.title}".`,
            type: "BOOKING_ACCEPTED",
            link: "/client/bookings",
          },
        });
      } else if (status === "DECLINED") {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            title: "Booking Declined",
            message: `${booking.worker.name} was unavailable for your requested time slot.`,
            type: "BOOKING_DECLINED",
            link: "/client/bookings",
          },
        });
      } else if (status === "COMPLETED") {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            title: "Job Marked Completed",
            message: `${booking.worker.name} completed "${booking.service.title}". Please leave a review!`,
            type: "BOOKING_COMPLETED",
            link: "/client/bookings",
          },
        });
      } else if (status === "CANCELLED") {
        const notifyTarget = isClient ? booking.workerId : booking.clientId;
        await prisma.notification.create({
          data: {
            userId: notifyTarget,
            title: "Booking Cancelled",
            message: `The booking for "${booking.service.title}" has been cancelled.`,
            type: "REMINDER",
            link: isClient ? "/worker/bookings" : "/client/bookings",
          },
        });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
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
