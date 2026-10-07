"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MessageSquare,
  CreditCard,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { Modal } from "@/ui/Modal";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { BookingDetailModal } from "@/components/dashboard/BookingDetailModal";
import { formatCurrency, formatDate, parseDateParts, getStatusColor } from "@/lib/utils";

export default function ClientBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  // Selected booking for detailed drawer / modal
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancelLoading(true);
    try {
      await fetch(`/api/bookings/${cancelModalBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setCancelModalBooking(null);
      fetchBookings();
    } catch {}
    setCancelLoading(false);
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    return b.status === activeTab;
  });

  const tabs = [
    { label: "All Bookings", val: "ALL" },
    { label: "Pending", val: "PENDING" },
    { label: "Accepted", val: "ACCEPTED" },
    { label: "In Progress", val: "IN_PROGRESS" },
    { label: "Completed", val: "COMPLETED" },
    { label: "Cancelled", val: "CANCELLED" },
  ];

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-6">
        {/* Sticky Header & Tabs Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 -mt-3.5 sm:-mt-6 lg:-mt-8 -mx-3.5 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">My Bookings</h1>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                Track status, reschedule appointments, process payments, and write reviews.
              </p>
            </div>
            <Link href="/workers">
              <Button size="sm" variant="primary">
                Book New
              </Button>
            </Link>
          </div>

          {/* Tab Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.val}
                onClick={() => setActiveTab(tab.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  activeTab === tab.val
                    ? "bg-primary-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-8 text-center">
            <EmptyState
              icon={<Calendar className="w-6 h-6 text-slate-400" />}
              title="No Bookings Found"
              description={
                activeTab === "ALL"
                  ? "You have not booked any services yet."
                  : `No bookings found in status "${activeTab.toLowerCase()}".`
              }
              action={
                <Link href="/workers">
                  <Button size="sm" variant="primary">
                    Find Skilled Workers
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const statusColors = getStatusColor(b.status);
              const isPaid = b.paymentStatus === "PAID";
              const hasReview = Boolean(b.review);

              const dateParts = parseDateParts(b.bookingDate);

              return (
                <Card key={b.id} className="p-5 sm:p-6 space-y-4 border-slate-200/90 shadow-card hover:shadow-elevated transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      {/* Calendar Ticket Badge */}
                      <div className="w-13 sm:w-14 shrink-0 rounded-xl border border-slate-200/90 overflow-hidden text-center bg-white shadow-xs">
                        <div className="bg-primary-600 text-white text-[10px] font-extrabold uppercase py-0.5 tracking-wider">
                          {dateParts.month}
                        </div>
                        <div className="py-1 px-1 bg-white">
                          <span className="text-base sm:text-lg font-black text-navy-900 leading-none block">
                            {dateParts.day}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight mt-0.5">
                            {dateParts.weekday}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-navy-900">
                            {b.service.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.status === "ACCEPTED" || b.status === "IN_PROGRESS"
                                  ? "bg-emerald-600 animate-pulse"
                                  : b.status === "PENDING"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {b.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar
                            name={b.worker.name}
                            src={b.worker.avatarUrl}
                            size="sm"
                            className="w-5 h-5 rounded-md text-[10px]"
                          />
                          <p className="text-xs text-slate-600">
                            Pro: <span className="font-semibold text-navy-800">{b.worker.name}</span>
                            {b.worker.phone && (
                              <span className="text-slate-400"> • {b.worker.phone}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                        Quoted Price
                      </span>
                      <span className="text-xl font-extrabold text-navy-900">
                        {formatCurrency(b.quotedPrice)}
                      </span>
                      <span
                        className={`text-[11px] block font-medium ${
                          isPaid ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {isPaid ? "✓ Paid in Full" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Booking details middle row with icons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Appointment Date
                        </span>
                        <p className="font-semibold text-navy-900 mt-0.5">
                          {formatDate(b.bookingDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Time Window
                        </span>
                        <p className="font-semibold text-navy-900 mt-0.5">{b.timeSlot}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Special Instructions
                        </span>
                        <p className="text-slate-600 mt-0.5 line-clamp-1 truncate">
                          {b.requestDetails || "None provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Worker Notes if any */}
                  {b.notes && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900">
                      <span className="font-bold">Pro note:</span> {b.notes}
                    </div>
                  )}

                  {/* Action buttons row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 sm:flex-none justify-center"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedBooking(b)}
                      >
                        Details
                      </Button>

                      <Link href={`/client/messages?recipientId=${b.workerId}`} className="flex-1 sm:flex-none">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-center"
                          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        >
                          Message
                        </Button>
                      </Link>

                      {/* Cancel allowed if PENDING or ACCEPTED */}
                      {(b.status === "PENDING" || b.status === "ACCEPTED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 flex-1 sm:flex-none justify-center"
                          onClick={() => setCancelModalBooking(b)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Pay Button if not paid */}
                      {!isPaid && (b.status === "ACCEPTED" || b.status === "COMPLETED") && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full sm:w-auto justify-center"
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          onClick={() => setPaymentBooking(b)}
                        >
                          Pay {formatCurrency(b.quotedPrice)}
                        </Button>
                      )}

                      {/* Review Button if completed and no review yet */}
                      {b.status === "COMPLETED" && !hasReview && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Star className="w-3.5 h-3.5 text-amber-500" />}
                          onClick={() => setReviewBooking(b)}
                        >
                          Leave Review
                        </Button>
                      )}

                      {hasReview && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentBooking && (
        <PaymentModal
          isOpen={Boolean(paymentBooking)}
          onClose={() => setPaymentBooking(null)}
          booking={paymentBooking}
          onSuccess={fetchBookings}
        />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          isOpen={Boolean(reviewBooking)}
          onClose={() => setReviewBooking(null)}
          booking={reviewBooking}
          onSuccess={fetchBookings}
        />
      )}

      {/* Booking Detail & Timeline Modal */}
      {selectedBooking && (
        <BookingDetailModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          bookingId={selectedBooking.id}
          role="CLIENT"
          onUpdate={fetchBookings}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelModalBooking && (
        <Modal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => setCancelModalBooking(null)}
          title="Cancel This Booking?"
          description="Are you sure you want to cancel this scheduled service request?"
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              Cancelling will release the worker&apos;s reserved time slot and notify both parties.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalBooking(null)}
                disabled={cancelLoading}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={cancelLoading}
                onClick={handleCancelBooking}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
