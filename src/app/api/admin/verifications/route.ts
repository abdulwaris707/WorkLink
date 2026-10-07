import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const adminActionSchema = z.object({
  workerProfileId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_RESUBMISSION"]),
  reason: z.string().max(1000).optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const workers = await db.query.workerProfiles.findMany({
      orderBy: [desc(schema.workerProfiles.updatedAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true,
          },
        },
        verificationActivities: {
          orderBy: [desc(schema.verificationActivity.createdAt)],
          limit: 5,
        },
      },
    });

    return NextResponse.json({ workers });
  } catch (error: any) {
    console.error("Admin fetch verifications error:", error);
    return NextResponse.json({ error: "Failed to load verifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { workerProfileId, action, reason } = parsed.data;

    const worker = await db.query.workerProfiles.findFirst({
      where: eq(schema.workerProfiles.id, workerProfileId),
      with: { user: true },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    let nextStatus: "approved" | "rejected" | "needs_resubmission" = "approved";
    let isVerified = false;
    let isPublished = false;
    let notifyMessage = "";

    if (action === "APPROVE") {
      nextStatus = "approved";
      isVerified = true;
      isPublished = true;
      notifyMessage = "Congratulations! Your identity has been verified. Your profile is now publicly visible and open for bookings.";
    } else if (action === "REJECT") {
      nextStatus = "rejected";
      isVerified = false;
      isPublished = false;
      notifyMessage = `Your identity verification was rejected: ${reason || "Document details did not match or were unreadable."}`;
    } else if (action === "REQUEST_RESUBMISSION") {
      nextStatus = "needs_resubmission";
      isVerified = false;
      isPublished = false;
      notifyMessage = `Please resubmit your CNIC documents: ${reason || "Image was blurry or unreadable."}`;
    }

    await db
      .update(schema.workerProfiles)
      .set({
        verificationStatus: nextStatus,
        isVerified,
        isPublished,
        rejectionReason: reason || null,
        verifiedAt: action === "APPROVE" ? new Date() : null,
        verifiedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.workerProfiles.id, workerProfileId));

    // Audit log
    await db.insert(schema.verificationActivity).values({
      workerProfileId,
      actorId: user.id,
      action: action,
      notes: reason ? `Admin decision: ${action} - Reason: ${reason}` : `Admin decision: ${action}`,
    });

    // Notify worker
    await db.insert(schema.notifications).values({
      userId: worker.userId,
      title: action === "APPROVE" ? "Identity Verified!" : "Verification Update",
      message: notifyMessage,
      type: "VERIFICATION_UPDATE",
      link: "/worker/verification",
    });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error: any) {
    console.error("Admin verification action error:", error);
    return NextResponse.json({ error: "Failed to process verification decision" }, { status: 500 });
  }
}
