"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Avatar, RatingStars, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatDate } from "@/lib/utils";

export default function ClientReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        const clientReviews = (data.bookings || [])
          .filter((b: any) => Boolean(b.review))
          .map((b: any) => ({
            ...b.review,
            serviceTitle: b.service.title,
            workerName: b.worker.name,
            workerAvatar: b.worker.avatarUrl,
          }));
        setReviews(clientReviews);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">My Reviews & Ratings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified feedback you&apos;ve left for service professionals.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <EmptyState
              icon={<Star className="w-6 h-6 text-slate-300" />}
              title="No Reviews Submitted"
              description="After completing a service appointment, you can leave a verified rating and review here."
              action={
                <Link href="/client/bookings">
                  <Button size="sm" variant="outline">
                    View Completed Bookings
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <Card key={rev.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={rev.workerName} src={rev.workerAvatar} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">{rev.workerName}</h4>
                      <p className="text-xs text-slate-400">
                        {rev.serviceTitle} • {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={rev.rating} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {rev.workerResponse && (
                  <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-100 text-xs">
                    <span className="font-bold text-primary-800 block mb-0.5">
                      Pro Response:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{rev.workerResponse}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
