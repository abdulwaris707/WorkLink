import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { storePrivateDocument, maskCnic } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerProfile = await db.query.workerProfiles.findFirst({
      where: eq(schema.workerProfiles.userId, user.id),
      with: {
        verificationActivities: {
          orderBy: [desc(schema.verificationActivity.createdAt)],
          limit: 10,
        },
      },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      verification: {
        status: workerProfile.verificationStatus,
        cnicMasked: workerProfile.cnicMasked,
        hasFrontImage: Boolean(workerProfile.cnicFrontKey),
        hasBackImage: Boolean(workerProfile.cnicBackKey),
        rejectionReason: workerProfile.rejectionReason,
        verifiedAt: workerProfile.verifiedAt,
        isVerified: workerProfile.isVerified,
        activities: workerProfile.verificationActivities,
      },
    });
  } catch (error: any) {
    console.error("Fetch verification error:", error);
    return NextResponse.json({ error: "Failed to retrieve verification status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerProfile = await db.query.workerProfiles.findFirst({
      where: eq(schema.workerProfiles.userId, user.id),
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const cnicNumber = formData.get("cnicNumber") as string | null;
    const cnicFront = formData.get("cnicFront") as File | null;
    const cnicBack = formData.get("cnicBack") as File | null;

    if (!cnicNumber || !cnicFront || !cnicBack) {
      return NextResponse.json(
        { error: "CNIC number, front photo, and back photo are all required." },
        { status: 400 }
      );
    }

    const cleanedCnic = cnicNumber.replace(/\D/g, "");
    if (cleanedCnic.length !== 13) {
      return NextResponse.json(
        { error: "Invalid CNIC format. Must be a 13-digit identity number." },
        { status: 400 }
      );
    }

    // Store documents privately with binary validation
    const frontResult = await storePrivateDocument(cnicFront, "cnic_front");
    const backResult = await storePrivateDocument(cnicBack, "cnic_back");

    const masked = maskCnic(cleanedCnic);

    // Update worker profile
    await db
      .update(schema.workerProfiles)
      .set({
        verificationStatus: "submitted",
        cnicMasked: masked,
        cnicFrontKey: frontResult.key,
        cnicBackKey: backResult.key,
        isVerified: false,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.workerProfiles.id, workerProfile.id));

    // Audit trail logging
    await db.insert(schema.verificationActivity).values({
      workerProfileId: workerProfile.id,
      actorId: user.id,
      action: "SUBMITTED",
      notes: `Worker uploaded CNIC documents (${masked}) for verification review.`,
    });

    // Notify worker
    await db.insert(schema.notifications).values({
      userId: user.id,
      title: "Identity Documents Submitted",
      message: "Your CNIC documents have been received. Our team will review your application within 24–48 hours.",
      type: "VERIFICATION_UPDATE",
      link: "/worker/verification",
    });

    return NextResponse.json({
      success: true,
      status: "submitted",
      cnicMasked: masked,
      message: "Verification submitted successfully and queued for review.",
    });
  } catch (error: any) {
    console.error("Submit verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit verification" },
      { status: 400 }
    );
  }
}
