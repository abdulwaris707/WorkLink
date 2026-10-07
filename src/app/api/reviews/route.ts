import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can leave reviews" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating || !comment) {
      return NextResponse.json({ error: "Booking ID, rating (1-5), and review text are required" }, { status: 400 });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating)));

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, service: true, worker: true },
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
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        clientId: user.id,
        workerId: booking.workerId,
        rating: numericRating,
        comment: comment.trim(),
        isVerified: true,
      },
      include: {
        client: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Recalculate worker average rating
    const workerReviews = await prisma.review.findMany({
      where: { workerId: booking.workerId },
      select: { rating: true },
    });

    const totalCount = workerReviews.length;
    const avgRating =
      workerReviews.reduce((sum, r) => sum + r.rating, 0) / (totalCount || 1);

    await prisma.workerProfile.update({
      where: { userId: booking.workerId },
      data: {
        rating: parseFloat(avgRating.toFixed(2)),
        reviewCount: totalCount,
      },
    });

    // Notify worker
    await prisma.notification.create({
      data: {
        userId: booking.workerId,
        title: "New Review Received",
        message: `${user.name} gave you a ${numericRating}-star review for "${booking.service.title}".`,
        type: "REVIEW_RECEIVED",
        link: "/worker/reviews",
      },
    });

    return NextResponse.json({ success: true, review });
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
    const { reviewId, response } = body;

    if (!reviewId || !response) {
      return NextResponse.json({ error: "Review ID and response text are required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.workerId !== user.id) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 403 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { workerResponse: response.trim() },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error("Review response error:", error);
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
