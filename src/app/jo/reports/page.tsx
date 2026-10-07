"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Input";
import { Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { formatDate } from "@/lib/utils";

export default function AdminReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Resolution modal
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<"INVESTIGATING" | "RESOLVED" | "DISMISSED">("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `/api/jo/reports${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/jo/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: resolutionStatus,
          resolutionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }

      toast.success("Report Updated", `Status is now ${resolutionStatus}.`);
      setSelectedReport(null);
      setResolutionNotes("");
      fetchReports();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { label: "All Reports", val: "ALL" },
    { label: "Pending", val: "PENDING" },
    { label: "Investigating", val: "INVESTIGATING" },
    { label: "Resolved", val: "RESOLVED" },
    { label: "Dismissed", val: "DISMISSED" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Disputes & Incident Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Investigate client-worker conflicts, safety escalations, and terms-of-service violations.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          {tabs.map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                statusFilter === tab.val ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-slate-300" />}
              title="No Incident Reports"
              description="No user reports match your current filter parameters."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <Card
                key={rep.id}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white border-slate-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 font-bold">#{rep.id.slice(0, 8)}</span>
                    <h3 className="font-bold text-sm text-navy-900">{rep.reason}</h3>
                    <Badge
                      variant={
                        rep.status === "RESOLVED"
                          ? "success"
                          : rep.status === "DISMISSED"
                          ? "outline"
                          : rep.status === "INVESTIGATING"
                          ? "warning"
                          : "error"
                      }
                      size="sm"
                    >
                      {rep.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {rep.details}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      Reporter: <strong className="text-navy-900">{rep.reporter?.name}</strong> ({rep.reporter?.email})
                    </span>
                    {rep.reportedUser && (
                      <span>
                        Reported: <strong className="text-navy-900">{rep.reportedUser?.name}</strong> (
                        {rep.reportedUser?.email})
                      </span>
                    )}
                  </div>

                  {rep.resolutionNotes && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <span className="font-bold">Staff Resolution:</span> {rep.resolutionNotes} (by{" "}
                      {rep.resolver?.name || "Admin"})
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">Logged on {formatDate(rep.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedReport(rep);
                      setResolutionNotes(rep.resolutionNotes || "");
                      setResolutionStatus(rep.status === "PENDING" ? "RESOLVED" : rep.status);
                    }}
                  >
                    Action Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Resolution Modal */}
        {selectedReport && (
          <Modal
            isOpen={Boolean(selectedReport)}
            onClose={() => setSelectedReport(null)}
            title="Update Incident Report"
            description={`Report #${selectedReport.id.slice(0, 8)}: ${selectedReport.reason}`}
            maxWidth="sm"
          >
            <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e: any) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="INVESTIGATING">INVESTIGATING (Under active review)</option>
                  <option value="RESOLVED">RESOLVED (Action taken / completed)</option>
                  <option value="DISMISSED">DISMISSED (No violation / rejected)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder="e.g. Spoke with client, issued refund through provider, warned worker..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Save Resolution
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
