import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createReportSchema = z.object({
  reason: z.string().min(3, "Please provide a reason").max(255),
  details: z.string().min(10, "Please provide at least 10 characters explaining the issue").max(3000),
  bookingId: z.string().uuid().optional().nullable(),
  reportedUserId: z.string().uuid().optional().nullable(),
  reviewId: z.string().uuid().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only fetch the authenticated user's own reports (Never expose other users' reports)
    const userReports = await db.query.reports.findMany({
      where: eq(schema.reports.reporterId, user.id),
      orderBy: [desc(schema.reports.createdAt)],
    });

    return NextResponse.json({ success: true, reports: userReports });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reason, details, bookingId, reportedUserId, reviewId } = parsed.data;

    const [report] = await db
      .insert(schema.reports)
      .values({
        reporterId: user.id,
        reason,
        details,
        bookingId: bookingId || null,
        reportedUserId: reportedUserId || null,
        reviewId: reviewId || null,
        status: "PENDING",
      })
      .returning();

    // Confirmation notification to reporter
    await db.insert(schema.notifications).values({
      userId: user.id,
      title: "Report Received",
      message: `Your report regarding "${reason}" has been filed. Our moderation team will review it.`,
      type: "REMINDER",
      link: user.role === "CLIENT" ? "/client/settings" : "/worker/settings",
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
