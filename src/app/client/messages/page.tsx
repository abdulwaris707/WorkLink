"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ArrowLeft,
  Sparkles,
  Phone,
  AlertCircle,
} from "lucide-react";
import Pusher from "pusher-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Avatar, Skeleton, EmptyState, CardLoader } from "@/ui/Feedback";
import { formatDateTime, formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function ClientMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [inputContent, setInputContent] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pusherRef = useRef<any>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const convList = data.conversations || [];
      setConversations(convList);

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const conversationIdParam = params?.get("id");
      const recipientId = params?.get("recipientId");

      if (conversationIdParam) {
        const found = convList.find((c: any) => c.id === conversationIdParam);
        if (found) {
          setActiveConversationId(found.id);
          setShowMobileChat(true);
          return;
        }
      }

      if (recipientId) {
        const existing = convList.find((c: any) => c.workerId === recipientId);
        if (existing) {
          setActiveConversationId(existing.id);
          setShowMobileChat(true);
        } else {
          const createRes = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: recipientId }),
          });
          const createData = await createRes.json();
          if (createData.conversationId) {
            setActiveConversationId(createData.conversationId);
            setShowMobileChat(true);
          }
        }
      } else if (!activeConversationId && convList.length > 0 && typeof window !== "undefined" && window.innerWidth >= 640) {
        setActiveConversationId(convList[0].id);
      }
    } catch {
    } finally {
      setLoadingConv(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (id: string, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
      }
    } catch {
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  // Setup Real-Time Pusher Connection + Adaptive Smart Fallback Polling
  useEffect(() => {
    if (!activeConversationId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    if (pusherKey) {
      try {
        const pusher = new Pusher(pusherKey, {
          cluster,
        });
        pusherRef.current = pusher;

        const channel = pusher.subscribe(`conversation-${activeConversationId}`);
        channel.bind("new-message", (newMsg: any) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          fetchConversations();
        });

        channel.bind("messages-read", () => {
          setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
        });

        return () => {
          channel.unbind_all();
          pusher.unsubscribe(`conversation-${activeConversationId}`);
        };
      } catch (err) {
        console.warn("Pusher client error, relying on adaptive stream:", err);
      }
    }

    // Adaptive polling stream: instant updates every 2.5s while tab is visible
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchMessages(activeConversationId, true);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeConversationId, fetchMessages, fetchConversations]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    setShowMobileChat(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", convId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleBackToInbox = () => {
    setShowMobileChat(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      url.searchParams.delete("recipientId");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConversationId || sending) return;

    const content = inputContent.trim();
    setInputContent("");

    // Optimistic UI Append
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
      senderId: "me",
      pending: true,
      sender: {
        id: "me",
        name: "You",
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        fetchConversations();
      } else {
        // Rollback optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.worker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.worker?.workerProfile?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="CLIENT">
      <div className="flex-1 flex w-full h-full min-h-0 bg-white overflow-hidden">
        {/* Left: Conversations list (Visible on desktop OR on mobile when no chat is open) */}
        <div
          className={`w-full sm:w-80 md:w-96 border-r border-slate-200/80 flex flex-col bg-white shrink-0 h-full ${
            showMobileChat ? "hidden sm:flex" : "flex"
          }`}
        >
            {/* Sticky Inbox Header */}
            <div className="p-3.5 border-b border-slate-200/80 space-y-2 sticky top-0 z-20 bg-white shadow-xs">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">
                  Inbox
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700">
                  {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
                </span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search chats by name or trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingConv ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <CardLoader size="md" text="Loading chats..." />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-navy-900">No conversations yet</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                    When you contact a professional or make a booking, direct chat opens here.
                  </p>
                  <Link href="/workers" className="mt-4 inline-block">
                    <Button size="sm" variant="primary">
                      Browse Verified Pros
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConversationId;
                  const unread = conv._count?.messages || 0;
                  const lastMessage = conv.messages?.[0];

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full p-3.5 flex items-start gap-3 text-left transition-all relative ${
                        isSelected
                          ? "bg-primary-50/80 border-l-4 border-primary-600"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <Avatar
                        name={conv.worker.name}
                        src={conv.worker.avatarUrl}
                        size="md"
                        className="rounded-2xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-navy-900 truncate">
                            {conv.worker.name}
                          </h4>
                          {lastMessage && (
                            <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                              {formatDate(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-primary-700 font-semibold truncate mt-0.5">
                          {conv.worker.workerProfile?.category || "Trade Specialist"}
                        </p>

                        <p className="text-xs text-slate-500 truncate mt-1">
                          {lastMessage?.content || "Click to open chat..."}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Message conversation thread */}
          <div
            className={`flex-1 flex-col bg-slate-50/40 ${
              showMobileChat ? "flex" : "hidden sm:flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Banner with Back button on mobile */}
                <div className="p-3.5 sm:p-4 bg-white/98 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={handleBackToInbox}
                      className="sm:hidden p-1.5 -ml-1 text-slate-500 hover:text-navy-900 rounded-lg hover:bg-slate-100"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <Avatar
                      name={activeConversation.worker.name}
                      src={activeConversation.worker.avatarUrl}
                      size="md"
                      className="rounded-2xl shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-navy-900 truncate">
                          {activeConversation.worker.name}
                        </h3>
                        <span className="inline-flex items-center text-primary-600" title="Verified Worker">
                          <ShieldCheck className="w-3.5 h-3.5 fill-primary-50" />
                        </span>
                      </div>
                      <p className="text-[11px] text-primary-700 font-semibold truncate">
                        {activeConversation.worker.workerProfile?.category || "Verified Specialist"}
                      </p>
                    </div>
                  </div>

                  {activeConversation.booking && (
                    <Link
                      href="/client/bookings"
                      className="hidden md:flex items-center gap-2 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-xl text-xs hover:bg-primary-100 transition-colors shrink-0"
                    >
                      <Calendar className="w-3.5 h-3.5 text-primary-700" />
                      <span className="font-semibold text-primary-900 truncate max-w-[150px]">
                        {activeConversation.booking.service?.title}
                      </span>
                      <span className="text-[10px] text-primary-700 bg-white/70 px-1.5 py-0.5 rounded-md font-bold">
                        {activeConversation.booking.status}
                      </span>
                    </Link>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-3.5">
                  {loadingMessages ? (
                    <div className="py-16 flex flex-col items-center justify-center">
                      <CardLoader size="md" text="Loading message history..." />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-navy-900">Direct Message Channel</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Ask about service details, confirm scheduled arrival, or share job requirements.
                      </p>
                    </div>
                  ) : (
                    messages.map((m, index) => {
                      const isMe = m.senderId !== activeConversation.worker.id;
                      const isPending = m.pending;

                      return (
                        <div
                          key={m.id || index}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-subtle ${
                              isMe
                                ? "bg-primary-600 text-white rounded-br-xs font-medium"
                                : "bg-white text-navy-800 border border-slate-200/90 rounded-bl-xs font-normal"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            <div
                              className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                                isMe ? "text-primary-100" : "text-slate-400"
                              }`}
                            >
                              <span>{formatDateTime(m.createdAt).split("•")[1] || "Just now"}</span>
                              {isMe && (
                                isPending ? (
                                  <Clock className="w-3 h-3 text-primary-200 animate-spin" />
                                ) : m.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-primary-200" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-primary-300" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-white border-t border-slate-200/80 flex items-end gap-2"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Enter to send)"
                    className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                  <Button
                    type="submit"
                    size="md"
                    variant="primary"
                    disabled={!inputContent.trim() || sending}
                    isLoading={sending}
                    className="shrink-0 rounded-xl px-4 min-h-[44px]"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8 text-slate-300" />}
                  title="Select a Conversation"
                  description="Choose a chat from the inbox on the left to coordinate work details with your hired specialist."
                />
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
}
