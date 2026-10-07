"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, CheckCircle2, CornerDownRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Input";
import { Avatar, RatingStars, Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { formatDate } from "@/lib/utils";

export default function WorkerReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Response modal
  const [replyingReview, setReplyingReview] = useState<any | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile?.workerProfile?.slug) {
        const detailRes = await fetch(`/api/workers/${data.profile.workerProfile.slug}`);
        const detailData = await detailRes.json();
        setReviews(detailData.reviews || []);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !responseText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: replyingReview.id,
          response: responseText.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to post response");
      toast.success("Reply Published", "Your response is now visible on your public profile.");
      setReplyingReview(null);
      fetchReviews();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <DashboardLayout role="WORKER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Client Reviews & Ratings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build trust with future clients by responding professionally to feedback.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <EmptyState
              icon={<Star className="w-6 h-6 text-slate-300" />}
              title="No Client Reviews Yet"
              description="When you complete service bookings, clients will leave ratings and reviews here."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <Card key={rev.id} className="p-5 sm:p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={rev.client.name} src={rev.client.avatarUrl} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">{rev.client.name}</h4>
                      <p className="text-xs text-slate-400">
                        {rev.booking?.service?.title || "Completed Job"} • {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={rev.rating} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  "{rev.comment}"
                </p>

                {rev.workerResponse ? (
                  <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary-800">Your Response:</span>
                      <button
                        onClick={() => {
                          setReplyingReview(rev);
                          setResponseText(rev.workerResponse);
                        }}
                        className="text-[11px] text-primary-600 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{rev.workerResponse}</p>
                  </div>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingReview(rev);
                        setResponseText("");
                      }}
                      leftIcon={<CornerDownRight className="w-3.5 h-3.5" />}
                    >
                      Reply to Client
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      {replyingReview && (
        <Modal
          isOpen={Boolean(replyingReview)}
          onClose={() => setReplyingReview(null)}
          title={`Reply to ${replyingReview.client.name}`}
          description="Write a polite, professional reply. This will appear publicly on your profile."
          maxWidth="md"
        >
          <form onSubmit={handleSendResponse} className="space-y-4 pt-2">
            <Textarea
              placeholder="e.g. Thank you so much for the feedback! It was a pleasure working with you..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
              required
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyingReview(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submittingReply}>
                Post Response
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
