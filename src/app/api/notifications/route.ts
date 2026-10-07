import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const patchNotificationSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.query.notifications.findMany({
      where: eq(schema.notifications.userId, user.id),
      orderBy: [desc(schema.notifications.createdAt)],
      limit: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = patchNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { notificationId, markAll } = parsed.data;

    if (markAll) {
      await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(schema.notifications.userId, user.id),
            eq(schema.notifications.isRead, false)
          )
        );
    } else if (notificationId) {
      await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(schema.notifications.id, notificationId),
            eq(schema.notifications.userId, user.id)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
