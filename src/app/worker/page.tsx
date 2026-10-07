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
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Briefcase,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { UpcomingAppointmentCard } from "@/components/dashboard/UpcomingAppointmentCard";

export default function WorkerOverviewPage() {
  const [data, setData] = useState<{
    bookings: any[];
    conversations: any[];
    workerProfile: any;
    user: any;
  }>({ bookings: [], conversations: [], workerProfile: null, user: null });
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
        user: pData.profile || null,
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

  // Real earnings based only on real paid bookings
  const totalEarnings = data.bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + (b.quotedPrice || 0), 0);

  const nonPendingCount = data.bookings.filter((b) => b.status !== "PENDING").length;
  const completionRate =
    nonPendingCount > 0
      ? Math.round((completedJobs.length / nonPendingCount) * 100)
      : 100;

  // Profile completion calculation
  const profileSteps = [
    Boolean(data.workerProfile?.bio && data.workerProfile.bio.length > 20),
    Boolean(data.workerProfile?.category),
    Boolean(data.workerProfile?.skills && data.workerProfile.skills.length > 0),
    Boolean(data.workerProfile?.startingPrice),
    Boolean(data.workerProfile?.serviceArea),
    Boolean(data.workerProfile?.services && data.workerProfile.services.length > 0),
  ];
  const completedStepCount = profileSteps.filter(Boolean).length;
  const profilePercent = Math.round((completedStepCount / profileSteps.length) * 100);

  const verificationStatus = data.workerProfile?.verificationStatus || "not_started";

  return (
    <DashboardLayout role="WORKER">
      <div className="space-y-8">
        {/* Verification Status Warning / Action Banner */}
        {verificationStatus !== "approved" && !loading && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-amber-950">
                  {verificationStatus === "submitted" || verificationStatus === "under_review"
                    ? "Identity Verification Under Review"
                    : verificationStatus === "needs_resubmission"
                    ? "Action Needed: Please Resubmit Documents"
                    : "Identity Verification Required"}
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {verificationStatus === "submitted" || verificationStatus === "under_review"
                    ? "Your CNIC documents are being verified by our compliance team. Public bookings activate once approved."
                    : "Upload your physical CNIC front and back photos to become publicly visible and accept client bookings."}
                </p>
              </div>
            </div>
            <Link href="/worker/verification" className="shrink-0">
              <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                {verificationStatus === "submitted" || verificationStatus === "under_review"
                  ? "View Status"
                  : "Verify Now"}
              </Button>
            </Link>
          </div>
        )}

        {/* Top Header & Profile Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">Worker Dashboard</h1>
              {verificationStatus === "approved" && (
                <Badge variant="success" size="sm">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Pro
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Manage incoming requests, track real revenue, update weekly availability, and communicate with clients.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.workerProfile?.slug && (
              <Link href={`/workers/${data.workerProfile.slug}`} target="_blank" className="flex-1 sm:flex-none">
                <Button size="sm" variant="outline" className="w-full justify-center" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Live Profile
                </Button>
              </Link>
            )}
            <Link href="/worker/services" className="flex-1 sm:flex-none">
              <Button size="sm" variant="primary" className="w-full justify-center" leftIcon={<Layers className="w-4 h-4" />}>
                Services
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Link href="/worker/services" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <Layers className="w-5 h-5 text-primary-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">Add / Edit Services</span>
              <span className="text-[10px] text-slate-400 truncate block">Manage service menu</span>
            </Card>
          </Link>

          <Link href="/worker/availability" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">Availability</span>
              <span className="text-[10px] text-slate-400 truncate block">Weekly schedule</span>
            </Card>
          </Link>

          <Link href="/worker/bookings" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">Requests</span>
              <span className="text-[10px] text-slate-400 truncate block">{pendingRequests.length} pending</span>
            </Card>
          </Link>

          <Link href="/worker/verification" className="group">
            <Card hoverEffect className="p-3 sm:p-4 text-center border-slate-200">
              <ShieldCheck className="w-5 h-5 text-purple-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-navy-900 block truncate">CNIC Verification</span>
              <span className="text-[10px] text-slate-400 capitalize truncate block">{verificationStatus.replace("_", " ")}</span>
            </Card>
          </Link>
        </div>

        {/* Top 4 Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <Card className="p-3.5 sm:p-5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
              New Requests
            </span>
            <p className="text-xl sm:text-2xl font-bold text-navy-900 mt-1 sm:mt-2">
              {loading ? <Skeleton className="h-7 w-12" /> : pendingRequests.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-amber-600 mt-0.5 block truncate">Awaiting response</span>
          </Card>

          <Card className="p-3.5 sm:p-5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Active / Scheduled
            </span>
            <p className="text-xl sm:text-2xl font-bold text-navy-900 mt-1 sm:mt-2">
              {loading ? <Skeleton className="h-7 w-12" /> : upcomingJobs.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-primary-600 mt-0.5 block truncate">Upcoming appointments</span>
          </Card>

          <Card className="p-3.5 sm:p-5">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Gross Earnings (Paid)
            </span>
            <p className="text-xl sm:text-2xl font-bold text-navy-900 mt-1 sm:mt-2">
              {loading ? <Skeleton className="h-7 w-20" /> : formatCurrency(totalEarnings)}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              {completedJobs.length} completed jobs
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Job Completion Rate
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-2xl font-bold text-navy-900">{completionRate}%</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Rating: {data.workerProfile?.rating?.toFixed(1) || "5.0"} ★ ({data.workerProfile?.reviewCount || 0} reviews)
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
                      <p className="text-xs text-slate-500">
                        Client: <span className="font-semibold text-navy-800">{req.client.name}</span>
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
                        &ldquo;{req.requestDetails}&rdquo;
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
                    >
                      Accept Job
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Schedule & Messages Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Accepted Jobs (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900">Upcoming Scheduled Jobs</h2>
              <Link href="/worker/bookings" className="text-xs font-semibold text-primary-600 hover:underline">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : upcomingJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <EmptyState
                  icon={<Calendar className="w-5 h-5 text-slate-400" />}
                  title="No Scheduled Jobs"
                  description="You don't have any accepted or in-progress jobs scheduled."
                  action={
                    <Link href="/worker/services">
                      <Button size="sm" variant="outline">
                        Check Services
                      </Button>
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3.5">
                {upcomingJobs.slice(0, 4).map((job) => (
                  <UpcomingAppointmentCard
                    key={job.id}
                    booking={job}
                    userRole="WORKER"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Messages */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-navy-900">Recent Inquiries</h3>
                <Link href="/worker/messages" className="text-xs font-semibold text-primary-600 hover:underline">
                  Inbox
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : data.conversations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No client messages</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.conversations.slice(0, 3).map((conv) => (
                    <Link
                      key={conv.id}
                      href="/worker/messages"
                      className="py-3 flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors block"
                    >
                      <Avatar name={conv.client.name} src={conv.client.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-navy-900 truncate">{conv.client.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.messages?.[0]?.content || "Click to open chat"}
                        </p>
                      </div>
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
