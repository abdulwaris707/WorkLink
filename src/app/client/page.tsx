"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Search,
  MessageSquare,
  CreditCard,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Bell,
  UserCheck,
  PlusCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Avatar, Skeleton, EmptyState, DotLoader, CardLoader, CardTextLoader } from "@/ui/Feedback";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { UpcomingAppointmentCard } from "@/components/dashboard/UpcomingAppointmentCard";

export default function ClientOverviewPage() {
  const [data, setData] = useState<{
    user: any | null;
    bookings: any[];
    conversations: any[];
    recommendedWorkers: any[];
    notifications: any[];
  }>({ user: null, bookings: [], conversations: [], recommendedWorkers: [], notifications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, bookingsRes, convsRes, workersRes, notifsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/bookings"),
          fetch("/api/conversations"),
          fetch("/api/workers?sort=recommended"),
          fetch("/api/notifications"),
        ]);

        const [meData, bData, cData, wData, nData] = await Promise.all([
          meRes.json(),
          bookingsRes.json(),
          convsRes.json(),
          workersRes.json(),
          notifsRes.json(),
        ]);

        setData({
          user: meData.user || null,
          bookings: bData.bookings || [],
          conversations: cData.conversations || [],
          recommendedWorkers: (wData.workers || []).slice(0, 3),
          notifications: (nData.notifications || []).slice(0, 3),
        });
      } catch {
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingBookings = data.bookings.filter(
    (b) => b.status === "PENDING" || b.status === "ACCEPTED" || b.status === "IN_PROGRESS"
  );
  const completedBookings = data.bookings.filter((b) => b.status === "COMPLETED");
  const totalSpent = data.bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + (b.quotedPrice || 0), 0);

  // Profile completion calculation
  const profileSteps = [
    Boolean(data.user?.name),
    Boolean(data.user?.email),
    Boolean(data.user?.phone),
    Boolean(data.user?.location),
    Boolean(data.user?.avatarUrl),
  ];
  const completedStepCount = profileSteps.filter(Boolean).length;
  const profilePercent = Math.round((completedStepCount / profileSteps.length) * 100);

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-8">
        {/* Welcome Greeting & Profile Completion Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 text-white shadow-elevated">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-400">
              Welcome back
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <DotLoader size="sm" inline color="text-primary-300" />
                  <span className="text-sm font-medium text-white/80">Loading profile...</span>
                </span>
              ) : data.user?.name ? (
                `Hello, ${data.user.name}`
              ) : (
                "Welcome to WorkLink"
              )}
            </h1>
            <p className="text-xs text-slate-200 max-w-xl">
              Find verified tradespeople, track live appointment timelines, and securely chat with your service providers.
            </p>
          </div>

          {/* Profile Completion Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm shrink-0 min-w-0 sm:min-w-[220px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">Profile Completion</span>
              <span className="font-bold text-primary-300">{profilePercent}%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${profilePercent}%` }}
              />
            </div>
            <Link
              href="/client/settings"
              className="text-[11px] text-primary-300 hover:text-white mt-2 block font-medium"
            >
              Complete profile details →
            </Link>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Link href="/workers" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <Search className="w-5 h-5 text-primary-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">Find Workers</span>
              <span className="text-[10px] text-slate-400 truncate block">Browse directory</span>
            </Card>
          </Link>

          <Link href="/client/recommendations" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-primary-200 bg-primary-50/30">
              <Sparkles className="w-5 h-5 text-primary-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-primary-900 block truncate">Smart Matches</span>
              <span className="text-[10px] text-primary-600 truncate block">Custom ranking</span>
            </Card>
          </Link>

          <Link href="/client/bookings" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">My Bookings</span>
              <span className="text-[10px] text-slate-400 truncate block">{upcomingBookings.length} active jobs</span>
            </Card>
          </Link>

          <Link href="/client/messages" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">Messages</span>
              <span className="text-[10px] text-slate-400 truncate block">Direct inbox</span>
            </Card>
          </Link>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <Card className="p-3.5 sm:p-5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Active Bookings
            </span>
            <p className="text-xl sm:text-2xl font-bold text-navy-900 mt-1 sm:mt-2">
              {loading ? <CardTextLoader size="xs" /> : upcomingBookings.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-primary-600 mt-0.5 block truncate">Scheduled jobs</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Completed Jobs
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <CardTextLoader size="xs" /> : completedBookings.length}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">Successfully closed</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Unread Messages
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? (
                <CardTextLoader size="xs" />
              ) : (
                data.conversations.reduce((sum, c) => sum + (c._count?.messages || 0), 0)
              )}
            </p>
            <span className="text-[11px] text-blue-600 mt-1 block">Awaiting reply</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Spent
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <CardTextLoader size="xs" /> : formatCurrency(totalSpent)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Paid to pros</span>
          </Card>
        </div>

        {/* Main Grid: Upcoming Bookings & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Bookings List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900">Upcoming Appointments</h2>
              <Link
                href="/client/bookings"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <Card className="p-8">
                <CardLoader text="Loading upcoming appointments..." size="md" />
              </Card>
            ) : upcomingBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <EmptyState
                  icon={<Calendar className="w-5 h-5 text-slate-400" />}
                  title="No Active Bookings"
                  description="You don't have any pending or accepted jobs scheduled at the moment."
                  action={
                    <Link href="/workers">
                      <Button size="sm" variant="primary">
                        Find a Worker
                      </Button>
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3.5">
                {upcomingBookings.slice(0, 4).map((b) => (
                  <UpcomingAppointmentCard
                    key={b.id}
                    booking={b}
                    userRole="CLIENT"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Messages & Notification Preview */}
          <div className="space-y-6">
            {/* Recent Messages */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-navy-900">Recent Messages</h3>
                <Link
                  href="/client/messages"
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  Open Inbox
                </Link>
              </div>

              {loading ? (
                <CardLoader size="sm" text="Loading messages..." />
              ) : data.conversations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No active conversations yet
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.conversations.slice(0, 3).map((conv) => (
                    <Link
                      key={conv.id}
                      href="/client/messages"
                      className="py-3 flex items-center gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors block"
                    >
                      <Avatar name={conv.worker.name} src={conv.worker.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-navy-900 truncate">
                          {conv.worker.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.messages?.[0]?.content || "Click to view chat"}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Notification Preview */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-primary-600" /> Notifications
                </h3>
                <Link
                  href="/client/notifications"
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <CardLoader size="sm" text="Loading alerts..." />
              ) : data.notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent alerts</p>
              ) : (
                <div className="space-y-2.5">
                  {data.notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <p className="font-bold text-navy-900 truncate">{n.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
