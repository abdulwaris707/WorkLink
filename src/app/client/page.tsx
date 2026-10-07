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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export default function ClientOverviewPage() {
  const [data, setData] = useState<{
    bookings: any[];
    conversations: any[];
    recommendedWorkers: any[];
  }>({ bookings: [], conversations: [], recommendedWorkers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookingsRes, convsRes, workersRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/conversations"),
          fetch("/api/workers?sort=recommended"),
        ]);

        const [bData, cData, wData] = await Promise.all([
          bookingsRes.json(),
          convsRes.json(),
          workersRes.json(),
        ]);

        setData({
          bookings: bData.bookings || [],
          conversations: cData.conversations || [],
          recommendedWorkers: (wData.workers || []).slice(0, 3),
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

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Client Overview</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your upcoming service appointments, messages, and invoices.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/workers">
              <Button variant="primary" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                Find a Worker
              </Button>
            </Link>
            <Link href="/client/bookings">
              <Button variant="outline" size="sm">
                View All Bookings
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active Bookings
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-12" /> : upcomingBookings.length}
            </p>
            <span className="text-[11px] text-primary-600 mt-1 block">Scheduled jobs</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Completed Jobs
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-12" /> : completedBookings.length}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">Successfully closed</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Unread Messages
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? (
                <Skeleton className="h-8 w-12" />
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
              {loading ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalSpent)}
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
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
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
              <div className="space-y-3">
                {upcomingBookings.slice(0, 4).map((b) => {
                  const statusColors = getStatusColor(b.status);
                  return (
                    <Card key={b.id} hoverEffect className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar
                          name={b.worker.name}
                          src={b.worker.avatarUrl}
                          size="md"
                          className="rounded-xl"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-navy-900 truncate">
                            {b.service.title}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Pro: <span className="font-medium text-navy-800">{b.worker.name}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(b.bookingDate)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {b.timeSlot}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                        <Link href="/client/bookings">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Recent Messages & Quick Help */}
          <div className="space-y-6">
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
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
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
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={conv.worker.name} src={conv.worker.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy-900 group-hover:text-primary-600 transition-colors truncate">
                            {conv.worker.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {conv.messages[0]?.content || "No messages"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Recommended Pros Card */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-navy-900 mb-3">Recommended Pros</h3>
              <div className="space-y-3">
                {data.recommendedWorkers.map((w) => (
                  <Link
                    key={w.id}
                    href={`/workers/${w.slug}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={w.user.name} src={w.user.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy-900 group-hover:text-primary-600 transition-colors truncate">
                          {w.user.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {w.category} • {formatCurrency(w.startingPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-primary-600 group-hover:underline">
                      Hire
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
