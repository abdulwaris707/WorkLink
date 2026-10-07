import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, or, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { createConversationSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await db.query.conversations.findMany({
      where: or(
        eq(schema.conversations.clientId, user.id),
        eq(schema.conversations.workerId, user.id)
      ),
      orderBy: [desc(schema.conversations.updatedAt)],
      with: {
        client: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
            location: true,
          },
        },
        worker: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
          with: {
            workerProfile: {
              columns: {
                category: true,
                slug: true,
              },
            },
          },
        },
        booking: {
          columns: {
            id: true,
            status: true,
            bookingDate: true,
            timeSlot: true,
          },
          with: {
            service: {
              columns: {
                title: true,
                price: true,
              },
            },
          },
        },
        messages: {
          orderBy: [desc(schema.messages.createdAt)],
          limit: 1,
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
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { targetUserId, bookingId, initialMessage } = parsed.data;

    if (user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
    }

    // Role check: Only clients can initiate new conversations with workers
    if (user.role === "WORKER") {
      // Check if there is an existing conversation or booking
      const existingConv = await db.query.conversations.findFirst({
        where: and(
          eq(schema.conversations.workerId, user.id),
          eq(schema.conversations.clientId, targetUserId)
        ),
      });

      if (!existingConv && !bookingId) {
        return NextResponse.json(
          { error: "Workers cannot initiate new conversations with clients without an active booking" },
          { status: 403 }
        );
      }
    }

    const isClient = user.role === "CLIENT";
    const clientId = isClient ? user.id : targetUserId;
    const workerId = isClient ? targetUserId : user.id;

    // Verify worker exists and has WORKER role
    const targetUser = await db.query.users.findFirst({
      where: eq(schema.users.id, targetUserId),
    });
    if (!targetUser) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 404 });
    }

    // Check if conversation already exists
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(schema.conversations.clientId, clientId),
        eq(schema.conversations.workerId, workerId)
      ),
    });

    if (!conversation) {
      const [newConv] = await db
        .insert(schema.conversations)
        .values({
          clientId,
          workerId,
          bookingId: bookingId || null,
        })
        .returning();
      conversation = newConv;

      if (initialMessage && initialMessage.trim()) {
        await db.insert(schema.messages).values({
          conversationId: conversation.id,
          senderId: user.id,
          content: initialMessage.trim(),
        });
      }
    } else if (initialMessage && initialMessage.trim()) {
      await db.insert(schema.messages).values({
        conversationId: conversation.id,
        senderId: user.id,
        content: initialMessage.trim(),
      });

      await db
        .update(schema.conversations)
        .set({ updatedAt: new Date() })
        .where(eq(schema.conversations.id, conversation.id));
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}
