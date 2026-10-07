import React from "react";
import Link from "next/link";
import {
  Search,
  Wrench,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  MessageSquare,
  Award,
  ArrowRight,
  Star,
  Users,
  Zap,
  BookOpen,
  Truck,
  HeartHandshake,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  // Fetch top 3 verified workers for the featured section directly from DB
  const featuredWorkers = await prisma.workerProfile.findMany({
    where: {
      isPublished: true,
      user: { role: "WORKER" },
    },
    take: 3,
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          location: true,
        },
      },
      services: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });

  const categories = [
    { name: "Home Services", icon: Zap, count: "120+ pros", color: "bg-blue-50 text-blue-600 border-blue-200" },
    { name: "Repairs", icon: Wrench, count: "85+ pros", color: "bg-amber-50 text-amber-600 border-amber-200" },
    { name: "Cleaning", icon: Sparkles, count: "90+ pros", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { name: "Beauty & Wellness", icon: HeartHandshake, count: "45+ pros", color: "bg-purple-50 text-purple-600 border-purple-200" },
    { name: "Moving", icon: Truck, count: "60+ pros", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    { name: "Tutoring", icon: BookOpen, count: "75+ pros", color: "bg-rose-50 text-rose-600 border-rose-200" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentUser={currentUser} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-white via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700 shadow-subtle">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <span>Vetted Professionals & Protected Bookings</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.12]">
              Find the Right Help. <br className="hidden sm:inline" />
              <span className="text-primary-600">Get Work Done.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect directly with verified local tradespeople, cleaners, technicians, and specialists. 
              Transparent pricing, instant booking, and guaranteed reliability.
            </p>

            {/* Quick Search Action Bar */}
            <div className="pt-2 max-w-2xl mx-auto">
              <form
                action="/workers"
                method="GET"
                className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-elevated"
              >
                <div className="relative flex-1 w-full flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search by skill, service (e.g. Electrician, Cleaning)..."
                    className="w-full pl-11 pr-4 py-3 text-sm text-navy-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
                <Button type="submit" size="md" className="w-full sm:w-auto px-6 shrink-0">
                  Search Pros
                </Button>
              </form>
            </div>

            {/* Direct CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/workers">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Find a Worker
                </Button>
              </Link>
              <Link href="/signup?role=worker">
                <Button variant="outline" size="lg">
                  Join as a Worker
                </Button>
              </Link>
            </div>

            {/* Micro Trust Stats */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-100 max-w-lg mx-auto text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-navy-900">4.9/5</p>
                <p className="text-xs text-slate-500 font-medium">Average Rating</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-navy-900">100%</p>
                <p className="text-xs text-slate-500 font-medium">Verified Identity</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-navy-900">&lt; 30 min</p>
                <p className="text-xs text-slate-500 font-medium">Avg Response</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 block mb-1">
              Explore Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Popular Categories
            </h2>
          </div>
          <Link
            href="/workers"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 group"
          >
            All categories <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={`/workers?category=${encodeURIComponent(cat.name)}`}
                className="group"
              >
                <Card hoverEffect className="p-4 text-center h-full flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${cat.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 group-hover:text-primary-600 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-slate-500 mt-1">{cat.count}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Workers Section (Database Driven) */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Top Rated Talent
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
                Featured Verified Professionals
              </h2>
            </div>
            <Link
              href="/workers"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Browse all workers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker as any} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
            Simple Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
            How WorkLink Works
          </h2>
          <p className="text-sm text-slate-500">
            From search to final completion in 4 effortless steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center mx-auto text-sm border border-primary-200">
              1
            </div>
            <h3 className="text-base font-bold text-navy-900">Find</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Filter by category, price, reviews, and service area to discover vetted experts.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center mx-auto text-sm border border-primary-200">
              2
            </div>
            <h3 className="text-base font-bold text-navy-900">Book</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select an exact service and choose available time windows with upfront transparent pricing.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center mx-auto text-sm border border-primary-200">
              3
            </div>
            <h3 className="text-base font-bold text-navy-900">Chat</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Message your worker in real time to coordinate entry, job nuances, and progress updates.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mx-auto text-sm border border-emerald-200">
              4
            </div>
            <h3 className="text-base font-bold text-navy-900">Get It Done</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Job is completed, payment is released securely, and you leave a verified community review.
            </p>
          </Card>
        </div>
      </section>

      {/* Trust & Benefits */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Built on Trust and Reliability
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every detail is engineered to protect both clients and hard-working service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="text-sm font-bold text-navy-900">Verified Profiles</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Background checks, skill validations, and official identity screening for all pros.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <CalendarCheck className="w-6 h-6 text-primary-600" />
              <h3 className="text-sm font-bold text-navy-900">Easy Bookings</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time calendar availability without infinite phone tag or confusing back-and-forth.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-bold text-navy-900">Secure Communication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct in-app messaging keeps your phone number private while logging job agreements.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <Star className="w-6 h-6 text-amber-500" />
              <h3 className="text-sm font-bold text-navy-900">Clear Verified Reviews</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only clients with real completed bookings can leave feedback. No fake or bought ratings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA For Workers */}
      <section id="for-workers" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-navy-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-elevated">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
              For Skilled Professionals
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Turn your skills into opportunities.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Create your custom digital storefront, define your service menu, set your own hourly rates, 
              and build lifelong client relationships without hefty marketplace commission fees.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link href="/signup?role=worker">
                <Button variant="primary" size="lg" className="bg-primary-500 hover:bg-primary-600 text-white">
                  Join as a Pro Today
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="bg-transparent text-white border-slate-700 hover:bg-slate-800">
                  Pro Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
