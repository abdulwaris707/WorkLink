import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { requireAdmin, writeAdminAuditLog } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const suspendUserSchema = z.object({
  userId: z.string().uuid(),
  isSuspended: z.boolean(),
  reason: z.string().min(3).max(500),
});

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleParam = searchParams.get("role") || "ALL";
    const statusParam = searchParams.get("status") || "ALL";

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(ilike(schema.users.name, `%${search}%`), ilike(schema.users.email, `%${search}%`))
      );
    }

    if (roleParam !== "ALL") {
      conditions.push(eq(schema.users.role, roleParam as any));
    }

    if (statusParam === "ACTIVE") {
      conditions.push(eq(schema.users.isSuspended, false));
    } else if (statusParam === "SUSPENDED") {
      conditions.push(eq(schema.users.isSuspended, true));
    }

    const usersList = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.users.createdAt)],
      limit: 100,
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        avatarUrl: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        workerProfile: {
          columns: {
            id: true,
            slug: true,
            category: true,
            verificationStatus: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
    });

    return NextResponse.json({ users: usersList });
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await req.json();
    const parsed = suspendUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error.format() }, { status: 400 });
    }

    const { userId, isSuspended, reason } = parsed.data;

    // Cannot suspend oneself
    if (userId === adminCheck.id) {
      return NextResponse.json({ error: "Administrators cannot suspend their own account." }, { status: 400 });
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db
      .update(schema.users)
      .set({ isSuspended, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    const action = isSuspended ? "USER_SUSPENDED" : "USER_REACTIVATED";

    // Write audit log
    await writeAdminAuditLog({
      adminId: adminCheck.id,
      action,
      targetType: "USER",
      targetId: userId,
      details: `${targetUser.name} (${targetUser.email}) was ${isSuspended ? "suspended" : "reactivated"}. Reason: ${reason}`,
      metadata: { targetRole: targetUser.role, reason },
      req,
    });

    // Notify user
    await db.insert(schema.notifications).values({
      userId,
      title: isSuspended ? "Account Suspended" : "Account Reactivated",
      message: isSuspended
        ? `Your account has been suspended by administration. Reason: ${reason}`
        : `Your account has been reactivated by administration.`,
      type: "REMINDER",
    });

    return NextResponse.json({ success: true, isSuspended });
  } catch (error: any) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user account status" }, { status: 500 });
  }
}
