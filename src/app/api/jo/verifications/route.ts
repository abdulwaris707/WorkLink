import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin, writeAdminAuditLog } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminVerificationDecisionSchema = z.object({
  workerProfileId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_RESUBMISSION"]),
  reason: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "ALL";

    const whereCondition =
      statusParam !== "ALL"
        ? eq(schema.workerProfiles.verificationStatus, statusParam as any)
        : undefined;

    const workers = await db.query.workerProfiles.findMany({
      where: whereCondition,
      orderBy: [desc(schema.workerProfiles.updatedAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
            location: true,
          },
        },
        verificationActivities: {
          orderBy: [desc(schema.verificationActivity.createdAt)],
          with: {
            actor: {
              columns: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ workers });
  } catch (error: any) {
    console.error("Admin verifications GET error:", error);
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await req.json();
    const parsed = adminVerificationDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { workerProfileId, action, reason } = parsed.data;

    if ((action === "REJECT" || action === "REQUEST_RESUBMISSION") && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "A clear reason is required when rejecting or requesting resubmission." },
        { status: 400 }
      );
    }

    const workerProfile = await db.query.workerProfiles.findFirst({
      where: eq(schema.workerProfiles.id, workerProfileId),
      with: { user: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    let nextStatus: "approved" | "rejected" | "needs_resubmission";
    let notifTitle = "";
    let notifMessage = "";
    let activityAction = "";

    if (action === "APPROVE") {
      nextStatus = "approved";
      notifTitle = "CNIC Identity Verified!";
      notifMessage =
        "Congratulations! Your CNIC verification has been approved. Your profile is now eligible for public search and client bookings.";
      activityAction = "APPROVED";
    } else if (action === "REJECT") {
      nextStatus = "rejected";
      notifTitle = "Verification Rejected";
      notifMessage = `Your identity verification submission was rejected. Reason: ${reason}`;
      activityAction = "REJECTED";
    } else {
      nextStatus = "needs_resubmission";
      notifTitle = "Verification Resubmission Needed";
      notifMessage = `Please resubmit your identity documents. Issue reported: ${reason}`;
      activityAction = "RESUBMISSION_REQUESTED";
    }

    // Update worker profile
    await db
      .update(schema.workerProfiles)
      .set({
        verificationStatus: nextStatus,
        rejectionReason: nextStatus === "approved" ? null : reason || null,
        verifiedAt: nextStatus === "approved" ? new Date() : null,
        verifiedBy: nextStatus === "approved" ? adminCheck.id : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.workerProfiles.id, workerProfileId));

    // Record verification audit
    await db.insert(schema.verificationActivity).values({
      workerProfileId,
      actorId: adminCheck.id,
      action: activityAction,
      notes: reason || (action === "APPROVE" ? "Approved by administrator" : ""),
    });

    // Record admin audit log
    await writeAdminAuditLog({
      adminId: adminCheck.id,
      action: `VERIFICATION_${activityAction}`,
      targetType: "WORKER_VERIFICATION",
      targetId: workerProfileId,
      details: `Verification for ${workerProfile.user.name} (${workerProfile.user.email}) set to ${nextStatus}. Reason: ${reason || "None"}`,
      metadata: { previousStatus: workerProfile.verificationStatus, nextStatus, reason },
      req,
    });

    // Notify worker
    await db.insert(schema.notifications).values({
      userId: workerProfile.userId,
      title: notifTitle,
      message: notifMessage,
      type: "VERIFICATION_UPDATE",
      link: "/worker/verification",
    });

    return NextResponse.json({ success: true, verificationStatus: nextStatus });
  } catch (error: any) {
    console.error("Admin verifications decision error:", error);
    return NextResponse.json({ error: "Failed to record verification decision" }, { status: 500 });
  }
}
