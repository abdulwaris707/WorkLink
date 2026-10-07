"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Search,
  Eye,
  EyeOff,
  ShieldAlert,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
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

export default function AdminReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation Modal
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jo/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSubmitting(true);

    const willHide = !selectedReview.isHidden;

    try {
      const res = await fetch("/api/jo/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          isHidden: willHide,
          reason: moderationReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Moderation failed");
      }

      toast.success("Review Moderated", `Review has been ${willHide ? "hidden from public view" : "restored"}.`);
      setSelectedReview(null);
      setModerationReason("");
      fetchReviews();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Review & Feedback Moderation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain platform integrity. Hide abusive, fraudulent, or harassing reviews while preserving complete audit histories.
          </p>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<Star className="w-8 h-8 text-slate-300" />}
              title="No Reviews Found"
              description="No feedback records have been logged in the system yet."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card
                key={r.id}
                className={`p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border-slate-200 ${
                  r.isHidden ? "bg-slate-50/70 border-slate-300 opacity-80" : "bg-white"
                }`}
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-navy-900">{r.client.name}</span>
                    <span className="text-xs text-slate-400">reviewed</span>
                    <strong className="text-xs text-navy-800">{r.worker.name}</strong>
                    <span className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400" /> {r.rating} / 5
                    </span>
                    {r.isHidden && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Hidden from Public
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                    &ldquo;{r.comment}&rdquo;
                  </p>

                  {r.moderationReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <span className="font-bold">Moderation Reason:</span> {r.moderationReason}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">Logged on {formatDate(r.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <Button
                    size="sm"
                    variant={r.isHidden ? "outline" : "ghost"}
                    className={r.isHidden ? "text-emerald-700" : "text-rose-600 hover:bg-rose-50"}
                    onClick={() => {
                      setSelectedReview(r);
                      setModerationReason("");
                    }}
                  >
                    {r.isHidden ? "Unhide Review" : "Hide from Public"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Moderation Reason Modal */}
        {selectedReview && (
          <Modal
            isOpen={Boolean(selectedReview)}
            onClose={() => setSelectedReview(null)}
            title={selectedReview.isHidden ? "Restore Public Visibility" : "Hide Review from Directory"}
            description={`Review #${selectedReview.id.slice(0, 8)} by ${selectedReview.client.name}`}
            maxWidth="sm"
          >
            <form onSubmit={handleModerateSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Moderation Action <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder="e.g. Profanity, competitor spam, extortion allegation..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReview(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={selectedReview.isHidden ? "primary" : "destructive"}
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
