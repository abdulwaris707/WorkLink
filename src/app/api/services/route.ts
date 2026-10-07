import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      include: {
        services: {
          orderBy: { createdAt: "desc" },
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

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, category, durationMinutes, price, serviceArea } = body;

    if (!title || !description || !price) {
      return NextResponse.json({ error: "Title, description, and price are required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        workerProfileId: workerProfile.id,
        title: title.trim(),
        description: description.trim(),
        category: category || workerProfile.category,
        durationMinutes: parseInt(durationMinutes) || 60,
        price: parseFloat(price),
        serviceArea: serviceArea || workerProfile.serviceArea,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
