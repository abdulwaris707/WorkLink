"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Filter,
  ShieldCheck,
  Star,
  ExternalLink,
  Layers,
  MapPin,
  Calendar,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { formatDate } from "@/lib/utils";

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [verificationFilter, setVerificationFilter] = useState("ALL");

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (verificationFilter !== "ALL") params.set("verification", verificationFilter);

      const res = await fetch(`/api/jo/workers?${params.toString()}`);
      const data = await res.json();
      setWorkers(data.workers || []);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [categoryFilter, verificationFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Worker Directory Moderation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversight of skilled labor profiles, category representations, and public visibility states.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by worker name, category, or bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWorkers()}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="ALL">All Verifications</option>
              <option value="approved">Approved Only</option>
              <option value="submitted">Submitted Only</option>
              <option value="under_review">Under Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Workers List */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : workers.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<Briefcase className="w-8 h-8 text-slate-300" />}
              title="No Workers Found"
              description="No worker profiles match your current search parameters."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {workers.map((w) => (
              <Card
                key={w.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-slate-200"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={w.user.name} src={w.user.avatarUrl} size="lg" className="rounded-2xl shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-navy-900">{w.user.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold">
                        {w.category}
                      </span>
                      <Badge
                        variant={
                          w.verificationStatus === "approved"
                            ? "success"
                            : w.verificationStatus === "rejected"
                            ? "error"
                            : "default"
                        }
                        size="sm"
                      >
                        {w.verificationStatus}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{w.bio}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {w.rating ? Number(w.rating).toFixed(1) : "New"} ({w.reviewCount} reviews)
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {w.services?.length || 0} active services
                      </span>
                      {w.user.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {w.user.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <Link href={`/workers/${w.slug}`} target="_blank">
                    <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Public Profile
                    </Button>
                  </Link>
                  <Link href="/jo/verifications">
                    <Button size="sm" variant="ghost">
                      Audit CNIC
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
