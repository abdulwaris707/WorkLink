"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Skeleton } from "@/ui/Feedback";

export default function WorkerVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("not_started");
  const [cnicMasked, setCnicMasked] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  // Form states
  const [cnicInput, setCnicInput] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/worker/verification");
      const data = await res.json();
      if (res.ok && data.verification) {
        setStatus(data.verification.status || "not_started");
        setCnicMasked(data.verification.cnicMasked);
        setRejectionReason(data.verification.rejectionReason);
        setVerifiedAt(data.verification.verifiedAt);
        setActivities(data.verification.activities || []);
      }
    } catch {
      setErrorMsg("Failed to load verification status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format as 12345-1234567-1
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 13) val = val.substring(0, 13);
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12)}`;
    }
    setCnicInput(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const rawDigits = cnicInput.replace(/\D/g, "");
    if (rawDigits.length !== 13) {
      setErrorMsg("Please enter a valid 13-digit CNIC number (e.g. 42101-1234567-1).");
      return;
    }

    if (!frontFile || !backFile) {
      setErrorMsg("Both CNIC front and back photo files are required.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("cnicNumber", cnicInput);
      formData.append("cnicFront", frontFile);
      formData.append("cnicBack", backFile);

      const res = await fetch("/api/worker/verification", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Submission failed. Please check file format and try again.");
      } else {
        setSuccessMsg(data.message || "Documents submitted successfully!");
        fetchStatus();
      }
    } catch {
      setErrorMsg("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "approved":
        return <Badge variant="success" size="md"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved & Verified</Badge>;
      case "submitted":
      case "under_review":
        return <Badge variant="warning" size="md"><Clock className="w-3.5 h-3.5 mr-1" /> Under Review</Badge>;
      case "rejected":
        return <Badge variant="error" size="md"><XCircle className="w-3.5 h-3.5 mr-1" /> Application Rejected</Badge>;
      case "needs_resubmission":
        return <Badge variant="warning" size="md"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Action Required (Resubmit)</Badge>;
      default:
        return <Badge variant="default" size="md">Not Started</Badge>;
    }
  };

  return (
    <DashboardLayout role="WORKER">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold tracking-tight text-navy-900">
                Identity & CNIC Verification
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              WorkLink requires official identity verification to activate your public profile and start receiving client bookings.
            </p>
          </div>
          <div className="shrink-0">{!loading && getStatusBadge()}</div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Status Informational Callouts */}
            {status === "approved" && (
              <Card className="p-6 bg-emerald-50/70 border-emerald-200 text-emerald-900 flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-emerald-950">You Are Fully Verified!</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Your CNIC ({cnicMasked}) was verified on {verifiedAt ? new Date(verifiedAt).toLocaleDateString() : "file"}. 
                    Your profile carries the verified badge and is discoverable in the public marketplace directory.
                  </p>
                </div>
              </Card>
            )}

            {(status === "submitted" || status === "under_review") && (
              <Card className="p-6 bg-amber-50/70 border-amber-200 text-amber-900 flex items-start gap-4">
                <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-amber-950">Verification in Progress</h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Your documents have been securely uploaded and are queued for human moderation review. 
                    Reviews typically take between 24–48 hours. You will receive an in-app notification once completed.
                  </p>
                  {cnicMasked && (
                    <p className="text-xs font-semibold text-amber-900 pt-1">
                      Submitted CNIC: <span className="font-mono bg-amber-100 px-2 py-0.5 rounded">{cnicMasked}</span>
                    </p>
                  )}
                </div>
              </Card>
            )}

            {(status === "rejected" || status === "needs_resubmission") && (
              <Card className="p-6 bg-rose-50/70 border-rose-200 text-rose-900 flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-base text-rose-950">
                    {status === "needs_resubmission" ? "Resubmission Requested" : "Verification Declined"}
                  </h3>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Reason: <span className="font-medium underline">{rejectionReason || "Image quality was insufficient or details did not match."}</span>
                  </p>
                  <p className="text-xs text-rose-700 pt-1">
                    Please upload clean, high-resolution photos of your original physical CNIC card below.
                  </p>
                </div>
              </Card>
            )}

            {/* Submission Form (Shown when not started, needs resubmission, or rejected) */}
            {(status === "not_started" || status === "needs_resubmission" || status === "rejected") && (
              <Card className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-navy-900">Upload Identity Documents</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Acceptable formats: JPEG, PNG, WebP (Max 5MB each). Scanned copies or phone photos with clear lighting.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* CNIC Number */}
                  <div>
                    <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                      National Identity Card Number (CNIC)
                    </label>
                    <Input
                      placeholder="42101-1234567-1"
                      value={cnicInput}
                      onChange={handleCnicChange}
                      maxLength={15}
                      required
                      helperText="13-digit national identity card number without dashes"
                    />
                  </div>

                  {/* Document Upload Grids */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Photo */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider">
                        CNIC Front Photo
                      </label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl p-5 text-center transition-colors bg-slate-50/50">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-navy-900">
                          {frontFile ? frontFile.name : "Click to select Front side"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Photo with visible portrait & CNIC number</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                          className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                          required
                        />
                      </div>
                    </div>

                    {/* Back Photo */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider">
                        CNIC Back Photo
                      </label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl p-5 text-center transition-colors bg-slate-50/50">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-navy-900">
                          {backFile ? backFile.name : "Click to select Back side"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Photo showing permanent address & barcode</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                          className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Security Guarantee */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Privacy Assurance:</strong> Your identity documents are stored in encrypted private server storage and are accessible only to verified WorkLink compliance staff. Your complete CNIC number is never published to the client directory.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={submitting}
                      disabled={submitting}
                    >
                      Submit for Identity Verification
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Audit History Timeline */}
            {activities.length > 0 && (
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-primary-600" />
                  Verification Activity Log
                </h3>
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-navy-900 block">
                          Action: {act.action}
                        </span>
                        <p className="text-slate-500">{act.notes || "Status logged"}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
