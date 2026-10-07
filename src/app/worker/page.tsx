"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  TrendingUp,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Layers,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export default function WorkerOverviewPage() {
  const [data, setData] = useState<{
    bookings: any[];
    conversations: any[];
    workerProfile: any;
  }>({ bookings: [], conversations: [], workerProfile: null });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [bookingsRes, convsRes, profileRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/conversations"),
        fetch("/api/profile"),
      ]);

      const [bData, cData, pData] = await Promise.all([
        bookingsRes.json(),
        convsRes.json(),
        profileRes.json(),
      ]);

      setData({
        bookings: bData.bookings || [],
        conversations: cData.conversations || [],
        workerProfile: pData.profile?.workerProfile || null,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (bookingId: string, status: "ACCEPTED" | "DECLINED") => {
    setActionLoadingId(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch {}
    setActionLoadingId(null);
  };

  const pendingRequests = data.bookings.filter((b) => b.status === "PENDING");
  const upcomingJobs = data.bookings.filter(
    (b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS"
  );
  const completedJobs = data.bookings.filter((b) => b.status === "COMPLETED");

  const totalEarnings = data.bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + (b.quotedPrice || 0), 0);

  const completionRate =
    data.bookings.length > 0
      ? Math.round(
          (completedJobs.length /
            (data.bookings.filter((b) => b.status !== "PENDING").length || 1)) *
            100
        )
      : 100;

  return (
    <DashboardLayout role="WORKER">
      <div className="space-y-8">
        {/* Welcome Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Worker Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage incoming jobs, accept requests, track revenue, and communicate with clients.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {data.workerProfile?.slug && (
              <Link href={`/workers/${data.workerProfile.slug}`} target="_blank">
                <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Live Profile
                </Button>
              </Link>
            )}
            <Link href="/worker/services">
              <Button size="sm" variant="primary" leftIcon={<Layers className="w-4 h-4" />}>
                Manage Services
              </Button>
            </Link>
          </div>
        </div>

        {/* Top 4 Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              New Requests
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-12" /> : pendingRequests.length}
            </p>
            <span className="text-[11px] text-amber-600 mt-1 block">Awaiting your response</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active / Scheduled
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-12" /> : upcomingJobs.length}
            </p>
            <span className="text-[11px] text-primary-600 mt-1 block">Upcoming appointments</span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Gross Earnings
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totalEarnings)}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              {completedJobs.length} completed jobs
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Average Rating
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-bold text-navy-900">
                {data.workerProfile?.rating?.toFixed(1) || "5.0"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {data.workerProfile?.reviewCount || 0} client reviews
            </span>
          </Card>
        </div>

        {/* Pending Booking Requests Action Box */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Action Required: New Requests
              </h2>
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {pendingRequests.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Card
                  key={req.id}
                  className="p-5 border-amber-200/90 bg-amber-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      name={req.client.name}
                      src={req.client.avatarUrl}
                      size="md"
                      className="rounded-xl"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">
                        {req.service.title} • {formatCurrency(req.quotedPrice)}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Client: <span className="font-semibold">{req.client.name}</span>
                        {req.client.phone && <span> ({req.client.phone})</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(req.bookingDate)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {req.timeSlot}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
                        "{req.requestDetails}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => handleUpdateStatus(req.id, "DECLINED")}
                      disabled={actionLoadingId === req.id}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                      isLoading={actionLoadingId === req.id}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Accept Job
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid: Scheduled Jobs & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scheduled Upcoming Jobs (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900">Scheduled Jobs</h2>
              <Link
                href="/worker/bookings"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                View all bookings
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : upcomingJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <EmptyState
                  icon={<Calendar className="w-6 h-6 text-slate-400" />}
                  title="No Jobs Scheduled"
                  description="Accepted bookings and in-progress service requests will appear here."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.slice(0, 4).map((b) => {
                  const statusColors = getStatusColor(b.status);
                  return (
                    <Card key={b.id} hoverEffect className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Avatar
                          name={b.client.name}
                          src={b.client.avatarUrl}
                          size="md"
                          className="rounded-xl"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-navy-900 truncate">
                            {b.service.title}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Client: <span className="font-semibold text-navy-800">{b.client.name}</span>
                            {b.client.location && ` • ${b.client.location}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>{formatDate(b.bookingDate)}</span>
                            <span>•</span>
                            <span>{b.timeSlot}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                        <Link href="/worker/bookings">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Client Chats */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-navy-900">Client Conversations</h3>
                <Link
                  href="/worker/messages"
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
                  No client messages yet
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.conversations.slice(0, 4).map((conv) => (
                    <Link
                      key={conv.id}
                      href="/worker/messages"
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={conv.client.name} src={conv.client.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy-900 truncate">
                            {conv.client.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {conv.messages[0]?.content || "No messages"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {conv.messages[0] && formatDate(conv.messages[0].createdAt)}
                      </span>
                    </Link>
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
