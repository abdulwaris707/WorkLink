import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const [dbUser] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        phone: schema.users.phone,
        location: schema.users.location,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ user: null });
    }

    let workerProfile: any = null;
    let clientProfile: any = null;

    if (dbUser.role === "WORKER") {
      const [wp] = await db
        .select()
        .from(schema.workerProfiles)
        .where(eq(schema.workerProfiles.userId, dbUser.id))
        .limit(1);

      if (wp) {
        const servicesList = await db
          .select()
          .from(schema.services)
          .where(eq(schema.services.workerProfileId, wp.id));

        const availabilityList = await db
          .select()
          .from(schema.availability)
          .where(eq(schema.availability.workerProfileId, wp.id));

        workerProfile = {
          ...wp,
          services: servicesList,
          availability: availabilityList,
        };
      }
    } else {
      const [cp] = await db
        .select()
        .from(schema.clientProfiles)
        .where(eq(schema.clientProfiles.userId, dbUser.id))
        .limit(1);
      clientProfile = cp || null;
    }

    // Count unread notifications
    const unreadNotifications = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, dbUser.id),
          eq(schema.notifications.isRead, false)
        )
      );

    return NextResponse.json({
      user: {
        ...dbUser,
        workerProfile,
        clientProfile,
      },
      unreadNotifications: unreadNotifications.length,
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
