import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ clientId: user.id }, { workerId: user.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            location: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            workerProfile: {
              select: {
                category: true,
                slug: true,
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            bookingDate: true,
            timeSlot: true,
            service: {
              select: {
                title: true,
                price: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: user.id },
                isRead: false,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, bookingId, initialMessage } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    const isClient = user.role === "CLIENT";
    const clientId = isClient ? user.id : targetUserId;
    const workerId = isClient ? targetUserId : user.id;

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        clientId,
        workerId,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clientId,
          workerId,
          bookingId: bookingId || null,
          ...(initialMessage && {
            messages: {
              create: {
                senderId: user.id,
                content: initialMessage.trim(),
              },
            },
          }),
        },
      });
    } else if (initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: initialMessage.trim(),
        },
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}
