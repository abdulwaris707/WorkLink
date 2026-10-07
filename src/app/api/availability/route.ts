import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, or, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { updateAvailabilitySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get("workerId");

    let targetWorkerProfileId: string | null = null;

    if (workerId) {
      const profile = await db.query.workerProfiles.findFirst({
        where: or(
          eq(schema.workerProfiles.id, workerId),
          eq(schema.workerProfiles.userId, workerId)
        ),
      });
      targetWorkerProfileId = profile?.id || null;
    } else {
      const user = await getCurrentUser();
      if (user && user.role === "WORKER") {
        const profile = await db.query.workerProfiles.findFirst({
          where: eq(schema.workerProfiles.userId, user.id),
        });
        targetWorkerProfileId = profile?.id || null;
      }
    }

    if (!targetWorkerProfileId) {
      return NextResponse.json({ schedule: [] });
    }

    const schedule = await db.query.availability.findMany({
      where: eq(schema.availability.workerProfileId, targetWorkerProfileId),
      orderBy: [asc(schema.availability.dayOfWeek)],
    });

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error("Fetch availability error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const parsed = updateAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { slots, isAvailable } = parsed.data;

    if (isAvailable !== undefined) {
      await db
        .update(schema.workerProfiles)
        .set({ isAvailable: Boolean(isAvailable), updatedAt: new Date() })
        .where(eq(schema.workerProfiles.id, workerProfile.id));
    }

    if (Array.isArray(slots)) {
      // Clear existing availability slots
      await db
        .delete(schema.availability)
        .where(eq(schema.availability.workerProfileId, workerProfile.id));

      if (slots.length > 0) {
        await db.insert(schema.availability).values(
          slots.map((s) => ({
            workerProfileId: workerProfile.id,
            dayOfWeek: s.dayOfWeek !== undefined ? s.dayOfWeek : null,
            startTime: s.startTime || "09:00",
            endTime: s.endTime || "17:00",
            isBlocked: Boolean(s.isBlocked),
            blockedDate: s.blockedDate ? new Date(s.blockedDate) : null,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
