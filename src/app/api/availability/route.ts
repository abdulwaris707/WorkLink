import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get("workerId");

    let targetWorkerProfileId: string | null = null;

    if (workerId) {
      const profile = await prisma.workerProfile.findFirst({
        where: { OR: [{ id: workerId }, { userId: workerId }] },
      });
      targetWorkerProfileId = profile?.id || null;
    } else {
      const user = await getCurrentUser();
      if (user && user.role === "WORKER") {
        const profile = await prisma.workerProfile.findUnique({
          where: { userId: user.id },
        });
        targetWorkerProfileId = profile?.id || null;
      }
    }

    if (!targetWorkerProfileId) {
      return NextResponse.json({ schedule: [] });
    }

    const schedule = await prisma.availability.findMany({
      where: { workerProfileId: targetWorkerProfileId },
      orderBy: { dayOfWeek: "asc" },
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

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { slots, isAvailable } = body;

    if (isAvailable !== undefined) {
      await prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: { isAvailable: Boolean(isAvailable) },
      });
    }

    if (Array.isArray(slots)) {
      // Re-create schedule slots
      await prisma.availability.deleteMany({
        where: { workerProfileId: workerProfile.id },
      });

      await prisma.availability.createMany({
        data: slots.map((s: any) => ({
          workerProfileId: workerProfile.id,
          dayOfWeek: s.dayOfWeek !== undefined ? parseInt(s.dayOfWeek) : null,
          startTime: s.startTime || "09:00",
          endTime: s.endTime || "17:00",
          isBlocked: Boolean(s.isBlocked),
          blockedDate: s.blockedDate ? new Date(s.blockedDate) : null,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
