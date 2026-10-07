"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Eye,
  User,
  Phone,
  MapPin,
  Calendar,
  Lock,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Input";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { formatDate } from "@/lib/utils";

export default function AdminVerificationsPage() {
  const toast = useToast();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");

  // Inspection modal
  const [inspectWorker, setInspectWorker] = useState<any | null>(null);

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"APPROVE" | "REJECT" | "REQUEST_RESUBMISSION">("APPROVE");
  const [decisionReason, setDecisionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jo/verifications${activeTab !== "ALL" ? `?status=${activeTab}` : ""}`);
      const data = await res.json();
      setWorkers(data.workers || []);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [activeTab]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectWorker) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/jo/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerProfileId: inspectWorker.id,
          action: decisionAction,
          reason: decisionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Decision failed");
      }

      toast.success("Verification Updated", `Worker status set to ${data.verificationStatus}`);
      setDecisionModalOpen(false);
      setInspectWorker(null);
      setDecisionReason("");
      fetchVerifications();
    } catch (err: any) {
      toast.error("Action Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    if (!search) return true;
    return (
      w.user.name.toLowerCase().includes(search.toLowerCase()) ||
      w.user.email.toLowerCase().includes(search.toLowerCase()) ||
      w.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  const tabs = [
    { label: "All Records", val: "ALL" },
    { label: "Submitted", val: "submitted" },
    { label: "Under Review", val: "under_review" },
    { label: "Approved", val: "approved" },
    { label: "Rejected", val: "rejected" },
    { label: "Needs Resubmission", val: "needs_resubmission" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Worker CNIC Verification Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict identity review pipeline. Approved workers unlock directory discovery and client bookings.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.val}
                onClick={() => setActiveTab(tab.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  activeTab === tab.val
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by worker name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : filteredWorkers.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<ShieldCheck className="w-8 h-8 text-slate-300" />}
              title="No Verifications in This State"
              description="No worker submissions match your current filter parameters."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWorkers.map((w) => {
              const status = w.verificationStatus;
              return (
                <Card
                  key={w.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200 bg-white"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <Avatar name={w.user.name} src={w.user.avatarUrl} size="md" className="rounded-xl shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-navy-900">{w.user.name}</h3>
                        <Badge
                          variant={
                            status === "approved"
                              ? "success"
                              : status === "rejected"
                              ? "error"
                              : status === "needs_resubmission"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        >
                          {status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {w.category} • <span className="font-mono text-slate-600">{w.cnicMasked || "No CNIC logged"}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {formatDate(w.updatedAt)} • {w.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setInspectWorker(w)}
                    >
                      Inspect & Review
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detailed Inspection Modal */}
        {inspectWorker && (
          <Modal
            isOpen={Boolean(inspectWorker)}
            onClose={() => setInspectWorker(null)}
            title="CNIC Verification Inspection"
            description={`Worker: ${inspectWorker.user.name} • Status: ${inspectWorker.verificationStatus}`}
            maxWidth="lg"
          >
            <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
              {/* Profile Details Grid */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact</span>
                  <p className="font-semibold text-navy-900">{inspectWorker.user.email}</p>
                  {inspectWorker.user.phone && <p className="text-slate-600">{inspectWorker.user.phone}</p>}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Category & Location</span>
                  <p className="font-semibold text-navy-900">{inspectWorker.category}</p>
                  <p className="text-slate-600">{inspectWorker.user.location || "Location not set"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Masked CNIC Record</span>
                  <p className="font-mono font-bold text-navy-900 text-sm">{inspectWorker.cnicMasked || "None"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Submission Timestamp</span>
                  <p className="text-slate-700">{new Date(inspectWorker.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Secure Document Previews */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-600" /> Private Document Deliverables
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Front Document */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                    <span className="text-xs font-semibold text-navy-900 block">CNIC Front Scan</span>
                    {inspectWorker.cnicFrontKey ? (
                      <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                        <img
                          src={`/api/worker/verification/document?key=${encodeURIComponent(
                            inspectWorker.cnicFrontKey
                          )}`}
                          alt="CNIC Front"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">No document uploaded.</p>
                    )}
                  </div>

                  {/* Back Document */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                    <span className="text-xs font-semibold text-navy-900 block">CNIC Back Scan</span>
                    {inspectWorker.cnicBackKey ? (
                      <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                        <img
                          src={`/api/worker/verification/document?key=${encodeURIComponent(
                            inspectWorker.cnicBackKey
                          )}`}
                          alt="CNIC Back"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">No document uploaded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection / Resubmission note if exists */}
              {inspectWorker.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <span className="font-bold">Prior Moderation Feedback:</span> {inspectWorker.rejectionReason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-700 border-amber-200 hover:bg-amber-50"
                  onClick={() => {
                    setDecisionAction("REQUEST_RESUBMISSION");
                    setDecisionModalOpen(true);
                  }}
                >
                  Request Resubmission
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDecisionAction("REJECT");
                    setDecisionModalOpen(true);
                  }}
                >
                  Reject Application
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setDecisionAction("APPROVE");
                    setDecisionModalOpen(true);
                  }}
                >
                  Approve Verification
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Confirmation & Reason Modal */}
        {decisionModalOpen && (
          <Modal
            isOpen={decisionModalOpen}
            onClose={() => setDecisionModalOpen(false)}
            title={
              decisionAction === "APPROVE"
                ? "Confirm Verification Approval"
                : decisionAction === "REJECT"
                ? "Confirm Rejection"
                : "Request Document Resubmission"
            }
            description="This decision will update the worker's status, notify them, and write a permanent audit log."
            maxWidth="sm"
          >
            <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
              {decisionAction !== "APPROVE" ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Moderator Reason / Instructions <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    placeholder="e.g. Back image is blurry, CNIC number does not match name..."
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to approve this worker&apos;s identity? Once approved, the worker will become
                  publicly bookable and discoverable in search results.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={decisionAction === "APPROVE" ? "primary" : "destructive"}
                  size="sm"
                  isLoading={submitting}
                >
                  Confirm Action
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
