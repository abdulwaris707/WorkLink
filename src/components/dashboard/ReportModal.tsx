"use client";

import React, { useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Textarea } from "@/ui/Input";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string | null;
  reportedUserId?: string | null;
  contextTitle?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  "No-show or late cancellation",
  "Substandard or incomplete work",
  "Unprofessional conduct or communication",
  "Payment or billing discrepancy",
  "Safety or security concern",
  "Misleading profile or impersonation",
  "Other terms of service violation",
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  reportedUserId,
  contextTitle,
  onSuccess,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim() || details.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          details: details.trim(),
          bookingId: bookingId || null,
          reportedUserId: reportedUserId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to file report");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError("");
    setDetails("");
    setReason(REPORT_REASONS[0]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report an Issue"
      description="Help us maintain a trustworthy community. Reports are reviewed by our operations team."
      maxWidth="md"
    >
      {success ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-navy-900">Report Submitted</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your incident report has been securely recorded. Our trust and safety team will review the details and take appropriate action.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {contextTitle && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <span className="font-semibold text-navy-900">Context:</span>
              <span className="truncate">{contextTitle}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Issue Category
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Details & Evidence
            </label>
            <Textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide a clear description of what happened, dates, and any relevant facts..."
              className="text-xs resize-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Minimum 10 characters ({details.length} entered)
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={loading}
              disabled={loading || details.trim().length < 10}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
