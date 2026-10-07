"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Avatar, Skeleton } from "@/ui/Feedback";
import { formatCurrency } from "@/lib/utils";

export default function ClientRecommendationsPage() {
  const [workDescription, setWorkDescription] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [urgency, setUrgency] = useState<"NORMAL" | "HIGH" | "EMERGENCY">("NORMAL");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"match" | "rating" | "price">("match");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDescription.trim()) {
      setErrorMsg("Please describe the service you need.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDescription: workDescription.trim(),
          category: category !== "All" ? category : undefined,
          location: location.trim() || undefined,
          maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
          preferredDate: preferredDate || undefined,
          urgency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to generate recommendations.");
      } else {
        setResults(data.results || []);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = results ? [...results].sort((a, b) => {
    if (sortBy === "rating") return b.worker.rating - a.worker.rating;
    if (sortBy === "price") return a.worker.startingPrice - b.worker.startingPrice;
    return b.matchScore - a.matchScore;
  }) : [];

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-bold text-primary-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Smart Worker Matching</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Find Your Best Worker Match
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe your project, budget, and timing. Our algorithmic scoring ranks verified service providers best equipped for your specific request.
          </p>
        </div>

        {/* Request Input Form Card */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-subtle">
          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                What work do you need done? *
              </label>
              <textarea
                rows={3}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="e.g. Need Level 2 EV charger wired in my garage, or deep kitchen oven cleaning and move-in refresh..."
                className="w-full p-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-navy-900 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-navy-900"
                >
                  <option value="All">All Categories</option>
                  <option value="Home Services">Home Services & Electrician</option>
                  <option value="Cleaning">Cleaning & Refresh</option>
                  <option value="Repairs">Repairs & Handyman</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                  <option value="Moving">Moving & Transport</option>
                  <option value="Tutoring">Tutoring</option>
                </select>
              </div>

              {/* Service Area */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
                  Your Area / City
                </label>
                <Input
                  placeholder="e.g. Seattle, WA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Max Budget */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
                  Max Budget ($)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 150"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
                  Timing / Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-navy-900"
                >
                  <option value="NORMAL">Standard Schedule</option>
                  <option value="HIGH">Within 24 Hours</option>
                  <option value="EMERGENCY">Urgent / Emergency</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                Transparent ranking based on verified credentials, location coverage & pricing fit.
              </span>
              <Button type="submit" variant="primary" size="md" isLoading={loading} disabled={loading}>
                <Zap className="w-4 h-4 mr-1.5" />
                Calculate Smart Matches
              </Button>
            </div>
          </form>
        </Card>

        {/* Results Section */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        )}

        {results !== null && !loading && (
          <div className="space-y-4">
            {/* Header & Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <h2 className="text-lg font-bold text-navy-900">
                Recommended Professionals ({sortedResults.length})
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <button
                  onClick={() => setSortBy("match")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    sortBy === "match" ? "bg-primary-600 text-white" : "bg-white border text-slate-700"
                  }`}
                >
                  Best Match
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    sortBy === "rating" ? "bg-primary-600 text-white" : "bg-white border text-slate-700"
                  }`}
                >
                  Highest Rated
                </button>
                <button
                  onClick={() => setSortBy("price")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    sortBy === "price" ? "bg-primary-600 text-white" : "bg-white border text-slate-700"
                  }`}
                >
                  Lowest Starting Price
                </button>
              </div>
            </div>

            {sortedResults.length === 0 ? (
              <Card className="p-12 text-center space-y-3">
                <Search className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-navy-900">No Workers Match This Specific Criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your budget range, changing your category to &quot;All&quot;, or searching with fewer keywords.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedResults.map((item, idx) => {
                  const worker = item.worker;
                  return (
                    <Card key={worker.id} hoverEffect className="p-6 overflow-hidden border-slate-200/90">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Worker Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar name={worker.name} src={worker.avatarUrl} size="lg" className="rounded-2xl" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-navy-900">{worker.name}</h3>
                              {worker.isVerified && (
                                <Badge variant="success" size="sm">
                                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified
                                </Badge>
                              )}
                              <span className="text-xs font-semibold text-primary-700">
                                {worker.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-bold text-navy-900">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {worker.rating.toFixed(1)} ({worker.reviewCount})
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {worker.serviceArea || "Metro Area"}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-navy-900">
                                Starting {formatCurrency(worker.startingPrice)}
                              </span>
                            </div>

                            {worker.bio && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                                {worker.bio}
                              </p>
                            )}

                            {/* Why Matched Tags */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {item.matchReasons.map((reason: string, rIdx: number) => (
                                <span
                                  key={rIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Match Score & Actions */}
                        <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          {/* Match Score Badge */}
                          <div className="text-center md:text-right">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 font-extrabold text-sm">
                              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                              {item.matchScore}% Match
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Algorithm Ranking</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Link href={`/client/messages?recipientId=${worker.id}`}>
                              <Button size="sm" variant="outline" className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> Message
                              </Button>
                            </Link>
                            <Link href={`/workers/${worker.slug}`}>
                              <Button size="sm" variant="primary">
                                Book Service
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
