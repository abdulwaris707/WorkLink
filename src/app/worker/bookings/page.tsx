"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  DollarSign,
  MessageSquare,
  Phone,
  MapPin,
  Check,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Input";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { BookingDetailModal } from "@/components/dashboard/BookingDetailModal";
import { formatCurrency, formatDate, parseDateParts, getStatusColor } from "@/lib/utils";

export default function WorkerBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Notes Modal state
  const [notesBooking, setNotesBooking] = useState<any | null>(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

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

  const handleUpdateStatus = async (
    bookingId: string,
    status: "ACCEPTED" | "DECLINED" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Booking Updated", `Status is now ${status.replace("_", " ")}.`);
      fetchBookings();
    } catch (err: any) {
      toast.error("Error", err.message || "Could not update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesBooking) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/bookings/${notesBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      toast.success("Notes Saved", "Booking notes updated.");
      setNotesBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSavingNotes(false);
    }
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
    { label: "Declined", val: "DECLINED" },
  ];

  return (
    <DashboardLayout role="WORKER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Manage Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept requests, track job progression, coordinate entry, and mark work completed.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.val}
              onClick={() => setActiveTab(tab.val)}
              className={`px-3.5 py-2 text-xs font-semibold shrink-0 border-b-2 transition-all ${
                activeTab === tab.val
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-navy-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
              description={`No bookings currently match "${activeTab.toLowerCase()}".`}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const statusColors = getStatusColor(b.status);
              const isPaid = b.paymentStatus === "PAID";

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
                            name={b.client.name}
                            src={b.client.avatarUrl}
                            size="sm"
                            className="w-5 h-5 rounded-md text-[10px]"
                          />
                          <p className="text-xs text-slate-600">
                            Client: <span className="font-semibold text-navy-800">{b.client.name}</span>
                            {b.client.phone && <span className="text-slate-400"> • {b.client.phone}</span>}
                            {b.client.location && <span className="text-slate-400"> • {b.client.location}</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                        Gross Payout
                      </span>
                      <span className="text-xl font-extrabold text-navy-900">
                        {formatCurrency(b.quotedPrice)}
                      </span>
                      <span
                        className={`text-[11px] block font-medium ${
                          isPaid ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {isPaid ? "✓ Client Paid" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Schedule & Request Details with icons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Scheduled Date
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
                          Time Slot
                        </span>
                        <p className="font-semibold text-navy-900 mt-0.5">{b.timeSlot}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Client Request Notes
                        </span>
                        <p className="text-slate-600 mt-0.5 line-clamp-1">{b.requestDetails || "None provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Internal Worker Notes */}
                  {b.notes && (
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
                      <span className="font-bold">Your private note:</span> {b.notes}
                    </div>
                  )}

                  {/* Actions Row */}
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

                      <Link href={`/worker/messages?recipientId=${b.clientId}`} className="flex-1 sm:flex-none">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-center"
                          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        >
                          Message
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 sm:flex-none justify-center text-xs"
                        onClick={() => {
                          setNotesBooking(b);
                          setNotesText(b.notes || "");
                        }}
                      >
                        {b.notes ? "Edit Note" : "+ Add Note"}
                      </Button>
                    </div>

                    {/* Status Mutation Controls */}
                    <div className="flex items-center gap-2">
                      {b.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleUpdateStatus(b.id, "DECLINED")}
                            disabled={actionLoadingId === b.id}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateStatus(b.id, "ACCEPTED")}
                            isLoading={actionLoadingId === b.id}
                          >
                            Accept
                          </Button>
                        </>
                      )}

                      {b.status === "ACCEPTED" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateStatus(b.id, "IN_PROGRESS")}
                          isLoading={actionLoadingId === b.id}
                          leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                        >
                          Mark In Progress
                        </Button>
                      )}

                      {b.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                          isLoading={actionLoadingId === b.id}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Mark Job Completed
                        </Button>
                      )}

                      {b.status === "COMPLETED" && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Work Completed
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

      {/* Booking Detail & Timeline Modal */}
      {selectedBooking && (
        <BookingDetailModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          bookingId={selectedBooking.id}
          role="WORKER"
          onUpdate={fetchBookings}
        />
      )}

      {/* Add / Edit Notes Modal */}
      {notesBooking && (
        <Modal
          isOpen={Boolean(notesBooking)}
          onClose={() => setNotesBooking(null)}
          title="Booking Notes"
          description="Keep private notes regarding entry codes, parts ordered, or job requirements."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveNotes} className="space-y-4 pt-2">
            <Textarea
              placeholder="e.g. Brought 50A breaker, client wants fixture placed 6ft above floor..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={4}
              required
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNotesBooking(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={savingNotes}>
                Save Notes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
