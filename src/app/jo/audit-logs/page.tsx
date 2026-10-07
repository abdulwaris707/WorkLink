"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Globe,
  User,
  Calendar,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Skeleton, EmptyState } from "@/ui/Feedback";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = `/api/jo/audit-logs${targetTypeFilter !== "ALL" ? `?targetType=${targetTypeFilter}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter]);

  const tabs = [
    { label: "All Audit Logs", val: "ALL" },
    { label: "Authentication", val: "AUTH" },
    { label: "Verifications", val: "WORKER_VERIFICATION" },
    { label: "User Accounts", val: "USER" },
    { label: "Bookings", val: "BOOKING" },
    { label: "Reviews", val: "REVIEW" },
    { label: "Reports", val: "REPORT" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Security & Administrative Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all administrative decisions, authentication occurrences, and operational overrides.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          {tabs.map((tab) => (
            <button
              key={tab.val}
              onClick={() => setTargetTypeFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                targetTypeFilter === tab.val ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<History className="w-8 h-8 text-slate-300" />}
              title="No Audit Records"
              description="No logs matching the current target type have been generated."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="p-3.5 bg-white border-slate-200 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {log.targetType} {log.targetId ? `• #${log.targetId.slice(0, 8)}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    {log.ipAddress && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {log.ipAddress}
                      </span>
                    )}
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-slate-700 mt-1.5 leading-relaxed font-sans">{log.details}</p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>Acting Admin: {log.admin?.name || log.adminId.slice(0, 8)} ({log.admin?.email})</span>
                  {log.userAgent && <span className="truncate max-w-[200px]">{log.userAgent}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
