"use client";

import React, { useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Textarea } from "@/ui/Input";
import { RatingStars } from "@/ui/Feedback";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    service: { title: string };
    worker: { name: string };
  };
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a few words about your experience.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave a Review"
      description={`Share your experience with ${booking.worker.name} for ${booking.service.title}.`}
      maxWidth="md"
    >
      {success ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-navy-900">Review Published!</h4>
          <p className="text-xs text-slate-500">
            Thank you for helping the community with verified feedback.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Rating
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-navy-900">
              {rating === 5
                ? "Excellent (5 Stars)"
                : rating === 4
                ? "Very Good (4 Stars)"
                : rating === 3
                ? "Average (3 Stars)"
                : rating === 2
                ? "Below Average (2 Stars)"
                : "Poor (1 Star)"}
            </span>
          </div>

          <div>
            <Textarea
              label="Your Feedback"
              placeholder="What went well? Was the worker on time, clean, communicative, and skilled?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Submit Review
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
