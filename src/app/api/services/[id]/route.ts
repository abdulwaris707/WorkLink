import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateServiceSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().min(5).max(2000).optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const service = await db.query.services.findFirst({
      where: eq(schema.services.id, id),
      with: { workerProfile: true },
    });

    if (!service || service.workerProfile.userId !== user.id) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 403 });
    }

    const updateData: Partial<typeof schema.services.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title.trim();
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description.trim();
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
    if (parsed.data.durationMinutes !== undefined) updateData.durationMinutes = parsed.data.durationMinutes;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    const [updated] = await db
      .update(schema.services)
      .set(updateData)
      .where(eq(schema.services.id, id))
      .returning();

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

    const service = await db.query.services.findFirst({
      where: eq(schema.services.id, id),
      with: { workerProfile: true },
    });

    if (!service || service.workerProfile.userId !== user.id) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 403 });
    }

    await db.delete(schema.services).where(eq(schema.services.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete service error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
