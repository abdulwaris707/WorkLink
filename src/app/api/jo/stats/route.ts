import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, or, desc, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    // Run parallel database queries on Neon
    const [
      clientCountRes,
      workerCountRes,
      pendingVerifRes,
      approvedWorkerRes,
      rejectedWorkerRes,
      activeBookingsRes,
      completedBookingsRes,
      revenueRes,
      paymentsGroupRes,
      openReportsRes,
      recentBookings,
      recentVerifications,
      recentAuditLogs,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.role, "CLIENT")),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.role, "WORKER")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.workerProfiles)
        .where(
          or(
            eq(schema.workerProfiles.verificationStatus, "submitted"),
            eq(schema.workerProfiles.verificationStatus, "under_review")
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.workerProfiles)
        .where(eq(schema.workerProfiles.verificationStatus, "approved")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.workerProfiles)
        .where(eq(schema.workerProfiles.verificationStatus, "rejected")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.bookings)
        .where(inArray(schema.bookings.status, ["PENDING", "ACCEPTED", "IN_PROGRESS"])),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.bookings)
        .where(eq(schema.bookings.status, "COMPLETED")),
      db
        .select({ sum: sql<number>`coalesce(sum(${schema.payments.amount}), 0)::float` })
        .from(schema.payments)
        .where(eq(schema.payments.status, "PAID")),
      db
        .select({
          status: schema.payments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.payments)
        .groupBy(schema.payments.status),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.reports)
        .where(inArray(schema.reports.status, ["PENDING", "INVESTIGATING"])),
      // Recent bookings
      db.query.bookings.findMany({
        orderBy: [desc(schema.bookings.createdAt)],
        limit: 5,
        with: {
          client: { columns: { id: true, name: true, email: true } },
          worker: { columns: { id: true, name: true, email: true } },
          service: { columns: { id: true, title: true } },
        },
      }),
      // Recent verifications
      db.query.workerProfiles.findMany({
        where: or(
          eq(schema.workerProfiles.verificationStatus, "submitted"),
          eq(schema.workerProfiles.verificationStatus, "under_review"),
          eq(schema.workerProfiles.verificationStatus, "approved")
        ),
        orderBy: [desc(schema.workerProfiles.updatedAt)],
        limit: 5,
        with: {
          user: { columns: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      // Recent audit logs
      db.query.adminAuditLogs.findMany({
        orderBy: [desc(schema.adminAuditLogs.createdAt)],
        limit: 6,
        with: {
          admin: { columns: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const paymentBreakdown = {
      PAID: 0,
      PENDING: 0,
      FAILED: 0,
      REFUNDED: 0,
    };
    paymentsGroupRes.forEach((row) => {
      if (row.status in paymentBreakdown) {
        paymentBreakdown[row.status as keyof typeof paymentBreakdown] = row.count;
      }
    });

    return NextResponse.json({
      stats: {
        totalClients: clientCountRes[0]?.count || 0,
        totalWorkers: workerCountRes[0]?.count || 0,
        pendingVerifications: pendingVerifRes[0]?.count || 0,
        approvedWorkers: approvedWorkerRes[0]?.count || 0,
        rejectedWorkers: rejectedWorkerRes[0]?.count || 0,
        activeBookings: activeBookingsRes[0]?.count || 0,
        completedBookings: completedBookingsRes[0]?.count || 0,
        totalVerifiedRevenue: revenueRes[0]?.sum || 0,
        paymentBreakdown,
        openReports: openReportsRes[0]?.count || 0,
      },
      recentBookings,
      recentVerifications,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
