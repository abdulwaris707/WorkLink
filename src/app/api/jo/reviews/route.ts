import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, writeAdminAuditLog } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const moderateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  isHidden: z.boolean(),
  reason: z.string().min(3).max(500),
});

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const reviewsList = await db.query.reviews.findMany({
      orderBy: [desc(schema.reviews.createdAt)],
      limit: 100,
      with: {
        client: {
          columns: { id: true, name: true, email: true, avatarUrl: true },
        },
        worker: {
          columns: { id: true, name: true, email: true, avatarUrl: true },
        },
        booking: {
          with: {
            service: { columns: { id: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json({ reviews: reviewsList });
  } catch (error: any) {
    console.error("Admin reviews GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await req.json();
    const parsed = moderateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { reviewId, isHidden, reason } = parsed.data;

    const review = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, reviewId),
      with: { client: true, worker: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await db
      .update(schema.reviews)
      .set({
        isHidden,
        moderationReason: reason,
        moderatedBy: adminCheck.id,
        moderatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.reviews.id, reviewId));

    // Write admin audit log
    await writeAdminAuditLog({
      adminId: adminCheck.id,
      action: isHidden ? "REVIEW_HIDDEN" : "REVIEW_UNHIDDEN",
      targetType: "REVIEW",
      targetId: reviewId,
      details: `Review #${reviewId.slice(0, 8)} ${isHidden ? "hidden from public view" : "restored"}. Reason: ${reason}`,
      metadata: { clientId: review.clientId, workerId: review.workerId, rating: review.rating, reason },
      req,
    });

    return NextResponse.json({ success: true, isHidden });
  } catch (error: any) {
    console.error("Admin reviews PATCH error:", error);
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 });
  }
}
