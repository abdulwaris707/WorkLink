"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Calendar,
  Clock,
  User,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatDateTime, formatDate, formatCurrency } from "@/lib/utils";

export default function WorkerMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [inputContent, setInputContent] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const convList = data.conversations || [];
      setConversations(convList);

      if (!activeConversationId && convList.length > 0) {
        setActiveConversationId(convList[0].id);
      }
    } catch {}
    setLoadingConv(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

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

  // Real-time polling
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
    <DashboardLayout role="WORKER">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Client Messages</h1>
          <p className="text-xs text-slate-500 mt-1">
            Communicate with your clients and coordinate upcoming jobs.
          </p>
        </div>

        <Card className="h-[750px] flex overflow-hidden border-slate-200/90 shadow-card">
          {/* Left: Client list */}
          <div className="w-full sm:w-80 md:w-96 border-r border-slate-200/80 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Client Inquiries
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
                  <p className="text-xs text-slate-400">No client messages yet.</p>
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
                        name={conv.client.name}
                        src={conv.client.avatarUrl}
                        size="md"
                        className="rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-navy-900 truncate">
                            {conv.client.name}
                          </h4>
                          {conv.messages[0] && (
                            <span className="text-[10px] text-slate-400">
                              {formatDate(conv.messages[0].createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conv.messages[0]?.content || "Start chatting..."}
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

          {/* Right: Messages conversation thread */}
          <div className="hidden sm:flex flex-1 flex-col bg-slate-50/50">
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={activeConversation.client.name}
                      src={activeConversation.client.avatarUrl}
                      size="md"
                      className="rounded-xl"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-navy-900">
                        {activeConversation.client.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {activeConversation.client.location || "Client"}
                      </p>
                    </div>
                  </div>

                  {activeConversation.booking && (
                    <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                      <span className="font-semibold text-navy-900">
                        {activeConversation.booking.service?.title}
                      </span>
                      <span className="text-slate-400">
                        ({formatDate(activeConversation.booking.bookingDate)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-48 rounded-xl" />
                      <Skeleton className="h-12 w-64 rounded-xl ml-auto" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-12">
                      Send a response to coordinate job requirements.
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId !== activeConversation.client.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <Avatar
                              name={activeConversation.client.name}
                              src={activeConversation.client.avatarUrl}
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

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Reply to client..."
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
                  description="Choose a client message from the left to read and reply."
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
