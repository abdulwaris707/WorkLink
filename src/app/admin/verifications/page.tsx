"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Clock,
  ArrowLeft,
  Briefcase,
  Search,
} from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Avatar, Skeleton } from "@/ui/Feedback";
import { Modal } from "@/ui/Modal";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "REQUEST_RESUBMISSION" | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/verifications");
      if (res.status === 403 || res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.workers) {
        setWorkers(data.workers);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async () => {
    if (!selectedWorker || !actionType) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerProfileId: selectedWorker.id,
          action: actionType,
          reason: reason.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSelectedWorker(null);
        setActionType(null);
        setReason("");
        loadData();
      }
    } catch {
      // Error handling
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const term = search.toLowerCase();
    return (
      w.user.name.toLowerCase().includes(term) ||
      w.user.email.toLowerCase().includes(term) ||
      (w.cnicMasked && w.cnicMasked.includes(term)) ||
      w.verificationStatus.includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Navbar */}
      <header className="bg-navy-900 text-white px-6 py-4 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white">WorkLink Admin Portal</span>
            <span className="text-[10px] text-primary-400 block uppercase font-semibold">Moderation & Verification</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button size="sm" variant="outline" className="text-white border-slate-700 hover:bg-navy-800">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to App
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Worker CNIC Verifications</h1>
            <p className="text-xs text-slate-500 mt-1">
              Review physical identity documentation and approve or reject worker public profiles.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by worker name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : filteredWorkers.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 text-xs">
            No worker verification records matching filter.
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar name={worker.user.name} src={worker.user.avatarUrl} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-navy-900">{worker.user.name}</h3>
                      <Badge
                        variant={
                          worker.verificationStatus === "approved"
                            ? "success"
                            : worker.verificationStatus === "submitted"
                            ? "warning"
                            : worker.verificationStatus === "rejected"
                            ? "error"
                            : "default"
                        }
                        size="sm"
                      >
                        {worker.verificationStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {worker.user.email} • {worker.category} • CNIC:{" "}
                      <span className="font-mono font-medium">{worker.cnicMasked || "Not provided"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* View Document Front */}
                  {worker.cnicFrontKey && (
                    <a
                      href={`/api/worker/verification/document?key=${encodeURIComponent(worker.cnicFrontKey)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Front
                    </a>
                  )}

                  {/* View Document Back */}
                  {worker.cnicBackKey && (
                    <a
                      href={`/api/worker/verification/document?key=${encodeURIComponent(worker.cnicBackKey)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Back
                    </a>
                  )}

                  {/* Decision Buttons */}
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setActionType("APPROVE");
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setActionType("REQUEST_RESUBMISSION");
                    }}
                  >
                    Resubmit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setActionType("REJECT");
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {selectedWorker && actionType && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedWorker(null);
            setActionType(null);
          }}
          title={`Confirm Action: ${actionType}`}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600">
              You are about to mark <strong>{selectedWorker.user.name}</strong> as{" "}
              <strong>{actionType}</strong>.
            </p>

            {(actionType === "REJECT" || actionType === "REQUEST_RESUBMISSION") && (
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Reason / Instructions for Worker:
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Back photo is too blurry to verify CNIC number..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedWorker(null);
                  setActionType(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "APPROVE" ? "primary" : "destructive"}
                size="sm"
                onClick={handleDecision}
                isLoading={actionLoading}
                disabled={actionLoading || ((actionType === "REJECT" || actionType === "REQUEST_RESUBMISSION") && !reason.trim())}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
