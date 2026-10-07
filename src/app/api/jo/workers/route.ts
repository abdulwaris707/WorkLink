import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "ALL";
    const verification = searchParams.get("verification") || "ALL";

    const conditions: any[] = [];

    if (category !== "ALL") {
      conditions.push(eq(schema.workerProfiles.category, category));
    }

    if (verification !== "ALL") {
      conditions.push(eq(schema.workerProfiles.verificationStatus, verification as any));
    }

    const workers = await db.query.workerProfiles.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.workerProfiles.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true,
            isSuspended: true,
            createdAt: true,
          },
        },
        services: {
          columns: {
            id: true,
            title: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    const filtered = search
      ? workers.filter(
          (w) =>
            w.user.name.toLowerCase().includes(search.toLowerCase()) ||
            w.user.email.toLowerCase().includes(search.toLowerCase()) ||
            w.bio.toLowerCase().includes(search.toLowerCase())
        )
      : workers;

    return NextResponse.json({ workers: filtered });
  } catch (error: any) {
    console.error("Admin workers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}
