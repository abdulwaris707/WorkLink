"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  ShieldCheck,
  RotateCcw,
  Users,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Badge } from "@/ui/Badge";
import { Skeleton, EmptyState } from "@/ui/Feedback";

function WorkersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states initialized from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = [
    "All",
    "Home Services",
    "Repairs",
    "Cleaning",
    "Beauty & Wellness",
    "Moving",
    "Tutoring",
  ];

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => {});
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (category && category !== "All") params.set("category", category);
      if (location) params.set("location", location);
      if (verifiedOnly) params.set("verified", "true");
      if (minRating) params.set("minRating", minRating);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/workers?${params.toString()}`);
      const data = await res.json();
      setWorkers(data.workers || []);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, location, verifiedOnly, minRating, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchWorkers]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategory("All");
    setLocation("");
    setVerifiedOnly(false);
    setMinRating("");
    setSort("recommended");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentUser={currentUser} />

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
            Find Skilled Professionals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified local contractors, trade experts, and specialized service pros.
          </p>

          {/* Search Bar & Quick Categories */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by worker name, skill, or service (e.g., Electrician, Deep Cleaning)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
              />
            </div>

            <div className="relative md:w-56">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="City or neighborhood..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
              />
            </div>

            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-navy-800"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          {/* Category Chips Bar */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  category === cat
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Filters & Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Refine Search
                </span>
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-xs font-semibold text-navy-800 mb-2">
                  Minimum Rating
                </label>
                <div className="space-y-1.5">
                  {[
                    { label: "All Ratings", val: "" },
                    { label: "4.5 & up", val: "4.5" },
                    { label: "4.8 & up", val: "4.8" },
                  ].map((r) => (
                    <label key={r.val} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={r.val}
                        checked={minRating === r.val}
                        onChange={() => setMinRating(r.val)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verified Filter */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-navy-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-primary-600" />
                    Verified Pros Only
                  </span>
                </label>
              </div>

              {/* Sort Dropdown */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-navy-800 mb-1.5">
                  Sort Results
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy-900 focus:outline-none focus:border-primary-500"
                >
                  <option value="recommended">Recommended</option>
                  <option value="highest_rated">Highest Rated</option>
                  <option value="lowest_price">Lowest Starting Price</option>
                  <option value="newest">Newest Profiles</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1 min-w-0">
            {/* Results count & active tags */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">
                {loading ? "Searching..." : `Showing ${workers.length} professionals`}
              </span>
              {(category !== "All" || searchTerm || location || verifiedOnly || minRating) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary-600 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : workers.length === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6 text-slate-400" />}
                title="No Workers Found"
                description="Try loosening your filters, selecting 'All' categories, or clearing your search term."
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-navy-900">Filters & Sorting</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-slate-400 hover:text-navy-900 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-2">
                Minimum Rating
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "All", val: "" },
                  { label: "★ 4.5+", val: "4.5" },
                  { label: "★ 4.8+", val: "4.8" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setMinRating(r.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      minRating === r.val
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Filter */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-semibold text-navy-800">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  Verified Pros Only
                </span>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
              </label>
            </div>

            {/* Sort Dropdown */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-navy-800 mb-1.5">
                Sort Results
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-navy-900 focus:outline-none focus:border-primary-500"
              >
                <option value="recommended">Recommended</option>
                <option value="highest_rated">Highest Rated</option>
                <option value="lowest_price">Lowest Starting Price</option>
                <option value="newest">Newest Profiles</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setMobileFiltersOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <Button
                type="button"
                className="flex-1 py-3"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show Results
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function WorkersDirectoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading directory...</div>}>
      <WorkersDirectoryContent />
    </Suspense>
  );
}
