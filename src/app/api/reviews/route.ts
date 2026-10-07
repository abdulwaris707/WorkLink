import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { createReviewSchema, reviewResponseSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can leave reviews" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review data", details: parsed.error.format() }, { status: 400 });
    }

    const { bookingId, rating, comment } = parsed.data;

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
      with: { review: true, service: true, worker: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Unauthorized: not your booking" }, { status: 403 });
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "You can only review bookings that are marked completed" }, { status: 400 });
    }

    if (booking.review) {
      return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 400 });
    }

    // Create review
    const [review] = await db
      .insert(schema.reviews)
      .values({
        bookingId: booking.id,
        clientId: user.id,
        workerId: booking.workerId,
        rating,
        comment: comment.trim(),
        isVerified: true,
      })
      .returning();

    // Recalculate worker average rating
    const workerReviews = await db.query.reviews.findMany({
      where: eq(schema.reviews.workerId, booking.workerId),
      columns: { rating: true },
    });

    const totalCount = workerReviews.length;
    const avgRating =
      workerReviews.reduce((sum, r) => sum + r.rating, 0) / (totalCount || 1);

    await db
      .update(schema.workerProfiles)
      .set({
        rating: parseFloat(avgRating.toFixed(2)),
        reviewCount: totalCount,
        updatedAt: new Date(),
      })
      .where(eq(schema.workerProfiles.userId, booking.workerId));

    // Notify worker
    await db.insert(schema.notifications).values({
      userId: booking.workerId,
      title: "New Review Received",
      message: `${user.name} gave you a ${rating}-star review for "${booking.service.title}".`,
      type: "REVIEW_RECEIVED",
      link: "/worker/reviews",
    });

    // Log booking activity
    await db.insert(schema.bookingActivity).values({
      bookingId: booking.id,
      actorId: user.id,
      action: "REVIEW_SUBMITTED",
      details: `Client submitted a ${rating}-star review`,
    });

    const fullReview = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, review.id),
      with: {
        client: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, review: fullReview });
  } catch (error: any) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Only workers can reply to reviews" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = reviewResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { reviewId, response } = parsed.data;

    const review = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, reviewId),
    });

    if (!review || review.workerId !== user.id) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 403 });
    }

    const [updated] = await db
      .update(schema.reviews)
      .set({
        workerResponse: response.trim(),
        updatedAt: new Date(),
      })
      .where(eq(schema.reviews.id, reviewId))
      .returning();

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error("Review response error:", error);
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
