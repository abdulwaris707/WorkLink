import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType") || "ALL";

    const where = targetType !== "ALL" ? eq(schema.adminAuditLogs.targetType, targetType) : undefined;

    const logs = await db.query.adminAuditLogs.findMany({
      where,
      orderBy: [desc(schema.adminAuditLogs.createdAt)],
      limit: 150,
      with: {
        admin: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Admin audit logs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
