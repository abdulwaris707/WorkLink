import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const service = await prisma.service.findUnique({
      where: { id },
      include: { workerProfile: true },
    });

    if (!service || service.workerProfile.userId !== user.id) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 403 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.description && { description: body.description.trim() }),
        ...(body.category && { category: body.category }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.durationMinutes !== undefined && { durationMinutes: parseInt(body.durationMinutes) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    console.error("Update service error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: { workerProfile: true },
    });

    if (!service || service.workerProfile.userId !== user.id) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 403 });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete service error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
