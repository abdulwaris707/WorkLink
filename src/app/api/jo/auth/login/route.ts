import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import {
  checkAdminLoginRateLimit,
  recordAdminLoginAttempt,
  writeAdminAuditLog,
} from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. Check Rate Limit
    const rateCheck = checkAdminLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // 2. Query user by email
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .limit(1);

    // Generic error: never reveal if user exists, password was wrong, or role is not admin
    if (!user || user.role !== "ADMIN") {
      recordAdminLoginAttempt(ip, false);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Check suspension
    if (user.isSuspended) {
      recordAdminLoginAttempt(ip, false);
      return NextResponse.json(
        { error: "Account suspended. Please contact technical management." },
        { status: 403 }
      );
    }

    // 4. Verify password hash
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      recordAdminLoginAttempt(ip, false);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 5. Successful login
    recordAdminLoginAttempt(ip, true);

    const sessionToken = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    setSessionCookie(sessionToken);

    // Write audit log
    await writeAdminAuditLog({
      adminId: user.id,
      action: "ADMIN_LOGIN_SUCCESS",
      targetType: "AUTH",
      targetId: user.id,
      details: `Administrator logged into /jo portal successfully`,
      req,
    });

    return NextResponse.json({ success: true, redirect: "/jo/dashboard" });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 500 });
  }
}
