"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  History,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Feedback";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jo/stats")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.stats) {
          setData(resData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Platform Operations Overview</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live telemetry and operational statistics from Neon Serverless PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/jo/verifications">
              <Button size="sm" variant="primary" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                Verification Queue ({stats?.pendingVerifications || 0})
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Core Platform Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Clients */}
          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clients</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : stats?.totalClients}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Registered service buyers</span>
          </Card>

          {/* Total Workers */}
          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workers</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : stats?.totalWorkers}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              {stats?.approvedWorkers || 0} approved • {stats?.rejectedWorkers || 0} rejected
            </span>
          </Card>

          {/* Pending Verifications */}
          <Card
            className={`p-4 border-slate-200 ${
              (stats?.pendingVerifications || 0) > 0 ? "bg-amber-50/40 border-amber-200" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Pending CNIC
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : stats?.pendingVerifications}
            </p>
            <Link
              href="/jo/verifications"
              className="text-[11px] text-amber-700 hover:underline font-semibold mt-1 flex items-center gap-1"
            >
              Review queue <ArrowRight className="w-3 h-3" />
            </Link>
          </Card>

          {/* Verified Revenue */}
          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Paid Revenue
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-7 w-20" /> : formatCurrency(stats?.totalVerifiedRevenue || 0)}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Confirmed provider payments</span>
          </Card>
        </div>

        {/* 2. Operations Row: Bookings & Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Booking States */}
          <Card className="p-5 bg-white border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary-600" /> Booking Pipeline
              </h3>
              <Link href="/jo/bookings" className="text-xs font-semibold text-primary-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Active Jobs</span>
                <span className="text-xl font-extrabold text-navy-900 block mt-1">
                  {loading ? "--" : stats?.activeBookings}
                </span>
                <span className="text-[10px] text-slate-400">Pending / Accepted / Active</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[11px] text-emerald-800 font-medium block">Completed</span>
                <span className="text-xl font-extrabold text-emerald-900 block mt-1">
                  {loading ? "--" : stats?.completedBookings}
                </span>
                <span className="text-[10px] text-emerald-700">Fulfilled services</span>
              </div>
            </div>
          </Card>

          {/* Payment Statuses */}
          <Card className="p-5 bg-white border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Health
              </h3>
              <Link href="/jo/payments" className="text-xs font-semibold text-primary-600 hover:underline">
                View Ledger
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 flex justify-between items-center">
                <span className="font-medium">Paid</span>
                <span className="font-bold">{stats?.paymentBreakdown?.PAID || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 flex justify-between items-center">
                <span className="font-medium">Pending</span>
                <span className="font-bold">{stats?.paymentBreakdown?.PENDING || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-900 flex justify-between items-center">
                <span className="font-medium">Failed</span>
                <span className="font-bold">{stats?.paymentBreakdown?.FAILED || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 flex justify-between items-center">
                <span className="font-medium">Refunded</span>
                <span className="font-bold">{stats?.paymentBreakdown?.REFUNDED || 0}</span>
              </div>
            </div>
          </Card>

          {/* Disputes & Alerts */}
          <Card className="p-5 bg-white border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Disputes & Alerts
              </h3>
              <Link href="/jo/reports" className="text-xs font-semibold text-primary-600 hover:underline">
                Moderation
              </Link>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-navy-900">Unresolved Reports</p>
                <p className="text-[11px] text-slate-500">Service disputes & flagged content</p>
              </div>
              <span
                className={`text-sm font-extrabold px-2.5 py-1 rounded-full ${
                  (stats?.openReports || 0) > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
                }`}
              >
                {stats?.openReports || 0}
              </span>
            </div>
          </Card>
        </div>

        {/* 3. Operational Tables: Recent Verifications & Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Verifications */}
          <Card className="p-5 bg-white border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Verification Submissions
              </h3>
              <Link href="/jo/verifications" className="text-xs font-semibold text-primary-600 hover:underline">
                Review All
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.recentVerifications?.length ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent verification records.</p>
            ) : (
              <div className="space-y-2">
                {data.recentVerifications.map((v: any) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs"
                  >
                    <div>
                      <p className="font-bold text-navy-900">{v.user.name}</p>
                      <p className="text-[10px] text-slate-400">{v.category} • {v.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.verificationStatus === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.verificationStatus === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {v.verificationStatus}
                      </span>
                      <Link href="/jo/verifications">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Security Audit Logs */}
          <Card className="p-5 bg-white border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Recent Security Activity
              </h3>
              <Link href="/jo/audit-logs" className="text-xs font-semibold text-primary-600 hover:underline">
                Audit Trail
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.recentAuditLogs?.length ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent audit logs recorded.</p>
            ) : (
              <div className="space-y-2">
                {data.recentAuditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{log.details}</p>
                    <span className="text-[10px] text-slate-400 block">
                      Admin: {log.admin?.name || log.adminId.slice(0, 8)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
