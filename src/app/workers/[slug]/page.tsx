"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Calendar,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Avatar, RatingStars, Skeleton } from "@/ui/Feedback";
import { BookingModal } from "@/components/workers/BookingModal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function WorkerDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;

  const [worker, setWorker] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [similarWorkers, setSimilarWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Fetch auth user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => {});

    // Fetch worker details
    fetch(`/api/workers/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.worker) {
          setWorker(data.worker);
          setReviews(data.reviews || []);
          setSimilarWorkers(data.similarWorkers || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleOpenBooking = (serviceId?: string) => {
    if (!currentUser) {
      router.push(`/login?redirect=/workers/${slug}`);
      return;
    }
    setSelectedServiceId(serviceId);
    setBookingModalOpen(true);
  };

  const handleStartMessage = async () => {
    if (!currentUser) {
      router.push(`/login?redirect=/workers/${slug}`);
      return;
    }

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: worker.user.id,
          initialMessage: `Hello ${worker.user.name}! I found your profile on WorkLink and would like to ask a question.`,
        }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push("/client/messages");
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar currentUser={currentUser} />
        <div className="max-w-7xl mx-auto px-4 py-12 w-full space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar currentUser={currentUser} />
        <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
          <h2 className="text-2xl font-bold text-navy-900">Worker Profile Not Found</h2>
          <p className="text-sm text-slate-500">
            This professional profile is either inactive or does not exist.
          </p>
          <Link href="/workers">
            <Button variant="primary">Return to Directory</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const lowestPrice =
    worker.services && worker.services.length > 0
      ? Math.min(...worker.services.map((s: any) => s.price))
      : worker.startingPrice;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentUser={currentUser} />

      {/* Hero Profile Banner */}
      <div className="bg-white border-b border-slate-200/80 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <Avatar
                name={worker.user.name}
                src={worker.user.avatarUrl}
                size="xl"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-subtle shrink-0"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
                    {worker.user.name}
                  </h1>
                  {worker.isVerified && (
                    <span
                      title="Verified Identity and Background Checked"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Pro
                    </span>
                  )}
                  {worker.isAvailable ? (
                    <Badge variant="success" size="sm">
                      Available for Hire
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Schedule Booked
                    </Badge>
                  )}
                </div>

                <p className="text-sm font-semibold text-primary-700">
                  {worker.category} Specialist
                </p>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1 text-navy-900 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{worker.rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{worker.serviceArea || worker.user.location}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Responds {worker.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Quick Actions on Desktop */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={handleStartMessage}
                leftIcon={<MessageSquare className="w-4 h-4 text-slate-600" />}
              >
                Message
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenBooking()}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details, Services, Portfolio, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-navy-900 mb-3">About {worker.user.name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {worker.bio || "Experienced professional delivering quality, on-time service."}
              </p>

              {/* Skills Chips */}
              {worker.skills && worker.skills.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-navy-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Services Offered */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-navy-900">Services & Pricing</h2>
                <span className="text-xs text-slate-500 font-medium">
                  {worker.services?.length || 0} packages available
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {worker.services?.map((svc: any) => (
                  <div
                    key={svc.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-navy-900">{svc.title}</h3>
                      <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                        {svc.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" /> ~{svc.durationMinutes} mins duration
                      </span>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-base font-bold text-navy-900">
                        {formatCurrency(svc.price)}
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenBooking(svc.id)}
                      >
                        Book This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Portfolio Gallery */}
            {worker.portfolioImages && worker.portfolioImages.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-navy-900 mb-4">Past Work & Portfolio</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {worker.portfolioImages.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden border border-slate-200 aspect-video relative group"
                    >
                      <img
                        src={img}
                        alt={`Portfolio sample ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Client Reviews */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-navy-900">Verified Client Reviews</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={worker.rating} showText />
                    <span className="text-xs text-slate-500">
                      based on {reviews.length} completed jobs
                    </span>
                  </div>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  No reviews posted yet. Be the first to book!
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="space-y-2 border-b border-slate-100 pb-5 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={rev.client.name} src={rev.client.avatarUrl} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-navy-900">
                                {rev.client.name}
                              </span>
                              {rev.isVerified && (
                                <Badge variant="success" size="sm" className="text-[10px] py-0">
                                  Verified Booking
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {rev.booking?.service?.title || "Completed Service"} • {formatDate(rev.createdAt)}
                            </span>
                          </div>
                        </div>
                        <RatingStars rating={rev.rating} size="sm" />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pl-10">
                        {rev.comment}
                      </p>

                      {/* Worker Response if any */}
                      {rev.workerResponse && (
                        <div className="ml-10 mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <span className="text-[11px] font-bold text-primary-700 block">
                            Response from {worker.user.name}:
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {rev.workerResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sticky Booking Panel (Desktop) */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <Card className="p-6 border-primary-200/80 shadow-elevated">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Starting Rate
                </span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-navy-900">
                    {formatCurrency(lowestPrice)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ service</span>
                </div>

                <div className="space-y-3 py-4 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Hourly Rate
                    </span>
                    <span className="font-semibold text-navy-900">
                      {formatCurrency(worker.hourlyRate)}/hr
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Guarantee
                    </span>
                    <span className="font-semibold text-emerald-700">WorkLink Protection</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Coverage
                    </span>
                    <span className="font-semibold text-navy-900">{worker.serviceArea}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2.5">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-md"
                    onClick={() => handleOpenBooking()}
                  >
                    Book an Appointment
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full justify-center"
                    onClick={handleStartMessage}
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    Direct Message
                  </Button>
                </div>
              </Card>

              {/* Similar Workers */}
              {similarWorkers.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3">
                    Other {worker.category} Pros
                  </h3>
                  <div className="space-y-3">
                    {similarWorkers.map((sim) => (
                      <Link
                        key={sim.id}
                        href={`/workers/${sim.slug}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={sim.user.name} src={sim.user.avatarUrl} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-navy-900 group-hover:text-primary-600 transition-colors">
                              {sim.user.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              From {formatCurrency(sim.startingPrice)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {worker && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          worker={{
            userId: worker.user.id,
            name: worker.user.name,
            services: worker.services || [],
          }}
          currentUser={currentUser}
          defaultServiceId={selectedServiceId}
        />
      )}

      <Footer />
    </div>
  );
}
