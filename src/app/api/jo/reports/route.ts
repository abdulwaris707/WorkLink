import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, writeAdminAuditLog } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resolveReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["INVESTIGATING", "RESOLVED", "DISMISSED"]),
  resolutionNotes: z.string().min(3).max(1000),
});

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "ALL";

    const where = statusParam !== "ALL" ? eq(schema.reports.status, statusParam as any) : undefined;

    const reportsList = await db.query.reports.findMany({
      where,
      orderBy: [desc(schema.reports.createdAt)],
      limit: 100,
      with: {
        reporter: {
          columns: { id: true, name: true, email: true, role: true },
        },
        reportedUser: {
          columns: { id: true, name: true, email: true, role: true },
        },
        booking: {
          with: {
            service: { columns: { id: true, title: true } },
          },
        },
        review: {
          columns: { id: true, rating: true, comment: true },
        },
        resolver: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ reports: reportsList });
  } catch (error: any) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await req.json();
    const parsed = resolveReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { reportId, status, resolutionNotes } = parsed.data;

    const report = await db.query.reports.findFirst({
      where: eq(schema.reports.id, reportId),
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await db
      .update(schema.reports)
      .set({
        status,
        resolutionNotes,
        resolvedBy: adminCheck.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.reports.id, reportId));

    // Write admin audit log
    await writeAdminAuditLog({
      adminId: adminCheck.id,
      action: `REPORT_${status}`,
      targetType: "REPORT",
      targetId: reportId,
      details: `Report #${reportId.slice(0, 8)} status set to ${status}. Notes: ${resolutionNotes}`,
      metadata: { previousStatus: report.status, nextStatus: status, resolutionNotes },
      req,
    });

    // Notify reporter if resolved or dismissed
    if (status === "RESOLVED" || status === "DISMISSED") {
      await db.insert(schema.notifications).values({
        userId: report.reporterId,
        title: `Report ${status === "RESOLVED" ? "Resolved" : "Dismissed"}`,
        message: `Your report regarding "${report.reason}" has been reviewed by staff: ${resolutionNotes}`,
        type: "REMINDER",
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Admin reports PATCH error:", error);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}
