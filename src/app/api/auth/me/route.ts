import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const detailedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      workerProfile: {
        include: {
          services: true,
          availability: true,
        },
      },
      clientProfile: true,
      _count: {
        select: {
          notifications: {
            where: { isRead: false },
          },
        },
      },
    },
  });

  return NextResponse.json({
    user: detailedUser,
    unreadNotifications: detailedUser?._count?.notifications || 0,
  });
}
