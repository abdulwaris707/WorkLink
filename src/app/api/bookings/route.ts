import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { createBookingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    // Only allow users to query their own bookings
    const userCondition =
      user.role === "WORKER"
        ? eq(schema.bookings.workerId, user.id)
        : eq(schema.bookings.clientId, user.id);

    const conditions = [userCondition];
    if (statusParam && statusParam !== "ALL") {
      conditions.push(eq(schema.bookings.status, statusParam as any));
    }

    const bookingList = await db
      .select({
        id: schema.bookings.id,
        clientId: schema.bookings.clientId,
        workerId: schema.bookings.workerId,
        serviceId: schema.bookings.serviceId,
        bookingDate: schema.bookings.bookingDate,
        timeSlot: schema.bookings.timeSlot,
        requestDetails: schema.bookings.requestDetails,
        quotedPrice: schema.bookings.quotedPrice,
        status: schema.bookings.status,
        paymentStatus: schema.bookings.paymentStatus,
        notes: schema.bookings.notes,
        createdAt: schema.bookings.createdAt,
        updatedAt: schema.bookings.updatedAt,
      })
      .from(schema.bookings)
      .where(and(...conditions))
      .orderBy(desc(schema.bookings.createdAt));

    // Enrich with relations
    const enriched = await Promise.all(
      bookingList.map(async (b) => {
        const [service] = await db
          .select()
          .from(schema.services)
          .where(eq(schema.services.id, b.serviceId))
          .limit(1);

        const [client] = await db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            phone: schema.users.phone,
            avatarUrl: schema.users.avatarUrl,
            location: schema.users.location,
          })
          .from(schema.users)
          .where(eq(schema.users.id, b.clientId))
          .limit(1);

        const [worker] = await db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            phone: schema.users.phone,
            avatarUrl: schema.users.avatarUrl,
          })
          .from(schema.users)
          .where(eq(schema.users.id, b.workerId))
          .limit(1);

        const [payment] = await db
          .select()
          .from(schema.payments)
          .where(eq(schema.payments.bookingId, b.id))
          .limit(1);

        const [review] = await db
          .select()
          .from(schema.reviews)
          .where(eq(schema.reviews.bookingId, b.id))
          .limit(1);

        return {
          ...b,
          service,
          client,
          worker,
          payment: payment || null,
          review: review || null,
        };
      })
    );

    return NextResponse.json({ bookings: enriched });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to book a service." },
        { status: 401 }
      );
    }

    if (user.role !== "CLIENT" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only clients can book services. Please use a client account." },
        { status: 403 }
      );
    }

    const rawBody = await req.json();
    const parsed = createBookingSchema.safeParse(rawBody);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Invalid booking data.";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { workerId, serviceId, bookingDate, timeSlot, requestDetails } = parsed.data;

    // Prevent booking oneself
    if (user.id === workerId) {
      return NextResponse.json(
        { error: "You cannot book your own service." },
        { status: 400 }
      );
    }

    // Verify service exists and is active
    const [service] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.isActive, true)))
      .limit(1);

    if (!service) {
      return NextResponse.json(
        { error: "The selected service is no longer available." },
        { status: 404 }
      );
    }

    // Verify worker exists and is available
    const [workerUser] = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(and(eq(schema.users.id, workerId), eq(schema.users.role, "WORKER")))
      .limit(1);

    if (!workerUser) {
      return NextResponse.json({ error: "Worker not found." }, { status: 404 });
    }

    // Verify worker profile is approved and published
    const [workerProfile] = await db
      .select({
        id: schema.workerProfiles.id,
        isVerified: schema.workerProfiles.isVerified,
        verificationStatus: schema.workerProfiles.verificationStatus,
        isPublished: schema.workerProfiles.isPublished,
      })
      .from(schema.workerProfiles)
      .where(eq(schema.workerProfiles.userId, workerId))
      .limit(1);

    if (!workerProfile || workerProfile.verificationStatus !== "approved" || !workerProfile.isVerified) {
      return NextResponse.json(
        { error: "This worker is undergoing identity verification and cannot accept bookings yet." },
        { status: 400 }
      );
    }

    const targetDate = new Date(bookingDate);

    // Prevent double booking for unavailable time slots
    const [existingConflict] = await db
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.workerId, workerId),
          eq(schema.bookings.bookingDate, targetDate),
          eq(schema.bookings.timeSlot, timeSlot),
          inArray(schema.bookings.status, ["PENDING", "ACCEPTED", "IN_PROGRESS"])
        )
      )
      .limit(1);

    if (existingConflict) {
      return NextResponse.json(
        { error: "This time window has already been requested or reserved. Please choose another slot." },
        { status: 409 }
      );
    }

    // Create booking
    const [newBooking] = await db
      .insert(schema.bookings)
      .values({
        clientId: user.id,
        workerId: workerUser.id,
        serviceId: service.id,
        bookingDate: targetDate,
        timeSlot,
        requestDetails: requestDetails.trim(),
        quotedPrice: service.price,
        status: "PENDING",
        paymentStatus: "PENDING",
      })
      .returning();

    // Audit activity trail
    await db.insert(schema.bookingActivity).values({
      bookingId: newBooking.id,
      actorId: user.id,
      action: "CREATED",
      details: `New booking request created for ${service.title} on ${targetDate.toLocaleDateString()} (${timeSlot})`,
    });

    // Ensure conversation exists between client and worker
    let [conversation] = await db
      .select()
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.clientId, user.id),
          eq(schema.conversations.workerId, workerUser.id)
        )
      )
      .limit(1);

    if (!conversation) {
      const [newConv] = await db
        .insert(schema.conversations)
        .values({
          clientId: user.id,
          workerId: workerUser.id,
          bookingId: newBooking.id,
        })
        .returning();
      conversation = newConv;
    }

    // Send automated context message
    await db.insert(schema.messages).values({
      conversationId: conversation.id,
      senderId: user.id,
      content: `Hello! I have created a new booking request for "${service.title}" on ${targetDate.toLocaleDateString()} (${timeSlot}). Details: ${requestDetails.trim()}`,
      isRead: false,
    });

    // Send in-app notification to worker
    await db.insert(schema.notifications).values({
      userId: workerUser.id,
      title: "New Booking Request",
      message: `${user.name} requested "${service.title}" for ${targetDate.toLocaleDateString()} (${timeSlot}).`,
      type: "BOOKING_REQUEST",
      link: "/worker/bookings",
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      booking: newBooking,
      conversationId: conversation.id,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
