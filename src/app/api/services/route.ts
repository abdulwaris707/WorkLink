import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { createServiceSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerProfile = await db.query.workerProfiles.findFirst({
      where: eq(schema.workerProfiles.userId, user.id),
      with: {
        services: {
          orderBy: [desc(schema.services.createdAt)],
        },
      },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    return NextResponse.json({ services: workerProfile.services });
  } catch (error: any) {
    console.error("Fetch services error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
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

    const body = await req.json();
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid service data", details: parsed.error.format() }, { status: 400 });
    }

    const { title, description, category, durationMinutes, price, serviceArea } = parsed.data;

    const [service] = await db
      .insert(schema.services)
      .values({
        workerProfileId: workerProfile.id,
        title: title.trim(),
        description: description.trim(),
        category: category || workerProfile.category,
        durationMinutes: durationMinutes ?? 60,
        price,
        serviceArea: serviceArea || workerProfile.serviceArea,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
