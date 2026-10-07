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
    const statusParam = searchParams.get("status") || "ALL";

    const where = statusParam !== "ALL" ? eq(schema.payments.status, statusParam as any) : undefined;

    const paymentsList = await db.query.payments.findMany({
      where,
      orderBy: [desc(schema.payments.createdAt)],
      limit: 100,
      with: {
        booking: {
          with: {
            service: { columns: { id: true, title: true } },
          },
        },
        client: {
          columns: { id: true, name: true, email: true },
        },
        worker: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ payments: paymentsList });
  } catch (error: any) {
    console.error("Admin payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
