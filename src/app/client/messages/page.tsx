"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Calendar,
  Clock,
  Check,
  CheckCheck,
  Search,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatDateTime, formatDate, formatCurrency } from "@/lib/utils";

export default function ClientMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [inputContent, setInputContent] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const convList = data.conversations || [];
      setConversations(convList);

      const recipientId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("recipientId") : null;
      if (recipientId) {
        const existing = convList.find((c: any) => c.workerId === recipientId);
        if (existing) {
          setActiveConversationId(existing.id);
        } else {
          const createRes = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: recipientId }),
          });
          const createData = await createRes.json();
          if (createData.conversationId) {
            setActiveConversationId(createData.conversationId);
          }
        }
      } else if (!activeConversationId && convList.length > 0) {
        setActiveConversationId(convList[0].id);
      }
    } catch {}
    setLoadingConv(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = async (id: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
      }
    } catch {}
    setLoadingMessages(false);
  };

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Polling to keep messages updated in real-time
  useEffect(() => {
    if (!activeConversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/messages`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConversationId) return;

    const content = inputContent.trim();
    setInputContent("");
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        fetchConversations();
      }
    } catch {}
    setSending(false);
  };

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Messages & Coordination</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time direct messaging with your hired service professionals.
          </p>
        </div>

        {/* Messaging Box Container */}
        <Card className="h-[750px] flex overflow-hidden border-slate-200/90 shadow-card">
          {/* Left: Conversations sidebar */}
          <div className="w-full sm:w-80 md:w-96 border-r border-slate-200/80 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Inbox Conversations
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingConv ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400">No conversations yet.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = conv.id === activeConversationId;
                  const unread = conv._count?.messages || 0;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                        isSelected
                          ? "bg-primary-50/70 border-r-2 border-primary-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <Avatar
                        name={conv.worker.name}
                        src={conv.worker.avatarUrl}
                        size="md"
                        className="rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-navy-900 truncate">
                            {conv.worker.name}
                          </h4>
                          {conv.messages[0] && (
                            <span className="text-[10px] text-slate-400">
                              {formatDate(conv.messages[0].createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-primary-700 font-medium truncate mt-0.5">
                          {conv.worker.workerProfile?.category || "Professional"}
                        </p>

                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conv.messages[0]?.content || "Start conversation..."}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Message history & Chat thread */}
          <div className="hidden sm:flex flex-1 flex-col bg-slate-50/50">
            {activeConversation ? (
              <>
                {/* Chat Top Banner */}
                <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={activeConversation.worker.name}
                      src={activeConversation.worker.avatarUrl}
                      size="md"
                      className="rounded-xl"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-navy-900">
                        {activeConversation.worker.name}
                      </h3>
                      <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified WorkLink Pro
                      </p>
                    </div>
                  </div>

                  {activeConversation.booking && (
                    <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                      <div>
                        <span className="font-semibold text-navy-900">
                          {activeConversation.booking.service?.title}
                        </span>
                        <span className="text-slate-400 ml-1.5">
                          {formatDate(activeConversation.booking.bookingDate)} ({activeConversation.booking.timeSlot})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-48 rounded-xl" />
                      <Skeleton className="h-12 w-64 rounded-xl ml-auto" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-12">
                      Send a message to coordinate your job details!
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId !== activeConversation.worker.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <Avatar
                              name={activeConversation.worker.name}
                              src={activeConversation.worker.avatarUrl}
                              size="sm"
                              className="mb-1"
                            />
                          )}

                          <div
                            className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? "bg-primary-600 text-white rounded-br-none shadow-sm"
                                : "bg-white text-navy-900 border border-slate-200/90 rounded-bl-none shadow-subtle"
                            }`}
                          >
                            <p className="whitespace-pre-line">{m.content}</p>
                            <span
                              className={`text-[9px] block text-right mt-1 ${
                                isMe ? "text-primary-100" : "text-slate-400"
                              }`}
                            >
                              {formatDateTime(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Field */}
                <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message to your pro..."
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-navy-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="h-9 px-4 shrink-0"
                    disabled={!inputContent.trim() || sending}
                    isLoading={sending}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <EmptyState
                  icon={<MessageSquare className="w-6 h-6 text-slate-300" />}
                  title="No Conversation Selected"
                  description="Choose a conversation from the sidebar to start chatting."
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
