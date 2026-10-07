import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = user.role === "WORKER" ? { workerId: user.id } : { clientId: user.id };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            workerProfile: {
              select: {
                slug: true,
                category: true,
                rating: true,
              },
            },
          },
        },
        payment: true,
        review: true,
        conversation: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to book a service" }, { status: 401 });
    }

    if (user.role !== "CLIENT" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only clients can book services. Please use a client account." }, { status: 403 });
    }

    const body = await req.json();
    const { workerId, serviceId, bookingDate, timeSlot, requestDetails } = body;

    if (!workerId || !serviceId || !bookingDate || !timeSlot || !requestDetails) {
      return NextResponse.json({ error: "Please fill in all booking details" }, { status: 400 });
    }

    if (user.id === workerId) {
      return NextResponse.json({ error: "You cannot book your own service" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return NextResponse.json({ error: "Selected service is no longer available" }, { status: 404 });
    }

    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        workerId: worker.id,
        serviceId: service.id,
        bookingDate: new Date(bookingDate),
        timeSlot,
        requestDetails: requestDetails.trim(),
        quotedPrice: service.price,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      include: {
        service: true,
        worker: true,
      },
    });

    // Ensure conversation exists between client and worker
    let conversation = await prisma.conversation.findFirst({
      where: {
        clientId: user.id,
        workerId: worker.id,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clientId: user.id,
          workerId: worker.id,
          bookingId: booking.id,
          messages: {
            create: {
              senderId: user.id,
              content: `Hello! I have created a new booking request for "${service.title}" on ${new Date(
                bookingDate
              ).toLocaleDateString()} (${timeSlot}). Details: ${requestDetails}`,
            },
          },
        },
      });
    } else {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: `New booking request for "${service.title}" on ${new Date(
            bookingDate
          ).toLocaleDateString()} (${timeSlot}). Details: ${requestDetails}`,
        },
      });
    }

    // Send notification to worker
    await prisma.notification.create({
      data: {
        userId: worker.id,
        title: "New Booking Request",
        message: `${user.name} requested "${service.title}" for ${new Date(
          bookingDate
        ).toLocaleDateString()} (${timeSlot}).`,
        type: "BOOKING_REQUEST",
        link: "/worker/bookings",
      },
    });

    return NextResponse.json({ success: true, booking, conversationId: conversation.id });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
