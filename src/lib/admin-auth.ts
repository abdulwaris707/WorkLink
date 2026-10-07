import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { db, schema } from "./db";
import { SessionUser } from "./types";

export interface AdminUser extends SessionUser {
  role: "ADMIN";
}

/**
 * Ensures request is from an authenticated, non-suspended ADMIN.
 * Returns the admin user or a safe JSON NextResponse (401 or 403).
 */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Access restricted to administrators" }, { status: 403 });
  }

  // Check suspension status from DB
  const [dbUser] = await db
    .select({ isSuspended: schema.users.isSuspended })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  if (dbUser?.isSuspended) {
    return NextResponse.json({ error: "Forbidden: Account is suspended" }, { status: 403 });
  }

  return user as AdminUser;
}

/**
 * Creates an immutable record in the admin_audit_logs table.
 */
export async function writeAdminAuditLog(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  metadata?: Record<string, any>;
  req?: NextRequest;
}) {
  try {
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (params.req) {
      ipAddress =
        params.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        params.req.headers.get("x-real-ip") ||
        undefined;
      userAgent = params.req.headers.get("user-agent") || undefined;
    }

    await db.insert(schema.adminAuditLogs).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || null,
      details: params.details || null,
      metadata: params.metadata || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (err) {
    console.error("Failed to write admin audit log:", err);
  }
}

// In-memory rate limiting for admin login attempts
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const loginRateLimits = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lock

export function checkAdminLoginRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimits.get(identifier);

  if (!entry) {
    return { allowed: true };
  }

  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const waitSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Reset if window has elapsed
  if (now - entry.lastAttempt > WINDOW_MS) {
    loginRateLimits.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordAdminLoginAttempt(identifier: string, success: boolean) {
  const now = Date.now();
  if (success) {
    loginRateLimits.delete(identifier);
    return;
  }

  const entry = loginRateLimits.get(identifier) || { attempts: 0, lastAttempt: now };
  entry.attempts += 1;
  entry.lastAttempt = now;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }

  loginRateLimits.set(identifier, entry);
}
