import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, not, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendMessageSchema } from "@/lib/validations";
import { triggerRealtimeEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const conversation = await db.query.conversations.findFirst({
      where: eq(schema.conversations.id, id),
      with: {
        client: {
          columns: { id: true, name: true, avatarUrl: true },
        },
        worker: {
          columns: { id: true, name: true, avatarUrl: true },
        },
        booking: {
          columns: {
            id: true,
            status: true,
            bookingDate: true,
            timeSlot: true,
            quotedPrice: true,
          },
          with: {
            service: { columns: { title: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Authorization: User cannot access another user's private messages
    if (conversation.clientId !== user.id && conversation.workerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Cannot access other users' conversations" }, { status: 403 });
    }

    // Mark messages from other user as read
    const updated = await db
      .update(schema.messages)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.messages.conversationId, id),
          not(eq(schema.messages.senderId, user.id)),
          eq(schema.messages.isRead, false)
        )
      )
      .returning({ id: schema.messages.id });

    if (updated.length > 0) {
      triggerRealtimeEvent(`conversation-${id}`, "messages-read", {
        conversationId: id,
        readerId: user.id,
      });
    }

    const messages = await db.query.messages.findMany({
      where: eq(schema.messages.conversationId, id),
      orderBy: [asc(schema.messages.createdAt)],
      with: {
        sender: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ conversation, messages });
  } catch (error: any) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message data", details: parsed.error.format() }, { status: 400 });
    }

    const { content } = parsed.data;

    const conversation = await db.query.conversations.findFirst({
      where: eq(schema.conversations.id, id),
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Authorization: User cannot access another user's private messages
    if (conversation.clientId !== user.id && conversation.workerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Cannot send messages in this conversation" }, { status: 403 });
    }

    const recipientId = conversation.clientId === user.id ? conversation.workerId : conversation.clientId;

    const [message] = await db
      .insert(schema.messages)
      .values({
        conversationId: id,
        senderId: user.id,
        content: content.trim(),
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(schema.conversations)
      .set({ updatedAt: new Date() })
      .where(eq(schema.conversations.id, id));

    // Notify recipient
    await db.insert(schema.notifications).values({
      userId: recipientId,
      title: `New message from ${user.name}`,
      message: content.length > 80 ? `${content.substring(0, 80)}...` : content,
      type: "NEW_MESSAGE",
      link: user.role === "CLIENT" ? "/worker/messages" : "/client/messages",
    });

    const fullMessage = await db.query.messages.findFirst({
      where: eq(schema.messages.id, message.id),
      with: {
        sender: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Broadcast real-time message to active participants
    triggerRealtimeEvent(`conversation-${id}`, "new-message", fullMessage);

    return NextResponse.json({ success: true, message: fullMessage });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
