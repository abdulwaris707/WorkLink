"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  DollarSign,
  User,
  Phone,
  MessageSquare,
  History,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Avatar, Skeleton } from "@/ui/Feedback";
import { Input } from "@/ui/Input";
import { useToast } from "@/ui/Toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ReportModal } from "./ReportModal";

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  role: "CLIENT" | "WORKER";
  onUpdate: () => void;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  bookingId,
  role,
  onUpdate,
}: BookingDetailModalProps) {
  const toast = useToast();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const fetchDetails = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Failed to load booking details");
      const data = await res.json();
      setBooking(data.booking);
      if (data.booking) {
        setNewDate(data.booking.bookingDate ? new Date(data.booking.bookingDate).toISOString().split("T")[0] : "");
        setNewTimeSlot(data.booking.timeSlot || "09:00 - 11:00 AM");
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      setIsRescheduling(false);
      fetchDetails();
    }
  }, [isOpen, bookingId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toast.success("Status Updated", `Booking is now marked ${newStatus.replace("_", " ")}.`);
      fetchDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setRescheduleLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate: newDate ? new Date(newDate).toISOString() : undefined,
          timeSlot: newTimeSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule booking");
      toast.success("Rescheduled", "Appointment date and time updated.");
      setIsRescheduling(false);
      fetchDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  if (!isOpen) return null;

  // Timeline step helper
  const steps = [
    { key: "PENDING", label: "Requested" },
    { key: "ACCEPTED", label: "Confirmed" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!booking) return "upcoming";
    const statusOrder = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];
    const currentIdx = statusOrder.indexOf(booking.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (booking.status === "CANCELLED" || booking.status === "DECLINED") {
      if (stepKey === "PENDING") return "completed";
      return "cancelled";
    }

    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "current";
    return "upcoming";
  };

  const counterpart = role === "CLIENT" ? booking?.worker : booking?.client;
  const isPaid = booking?.paymentStatus === "PAID";
  const canReschedule = booking?.status === "PENDING" || booking?.status === "ACCEPTED";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Details & Timeline"
      description={booking ? `Ref: ${booking.id.slice(0, 8)} • ${booking.service.title}` : "Loading..."}
      maxWidth="lg"
    >
      {loading || !booking ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6 pt-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* Status Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      getStatusColor(booking.status).bg
                    } ${getStatusColor(booking.status).text} ${getStatusColor(booking.status).border}`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isPaid ? "Paid in Full" : "Payment Pending"}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quoted Price
                </span>
                <p className="text-xl font-extrabold text-navy-900">
                  {formatCurrency(booking.quotedPrice)}
                </p>
              </div>
            </div>

            {/* Stepper Timeline */}
            {booking.status !== "CANCELLED" && booking.status !== "DECLINED" ? (
              <div className="mt-6 pt-4 border-t border-slate-200/70">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {steps.map((st, i) => {
                    const status = getStepStatus(st.key);
                    return (
                      <div key={st.key} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            status === "completed"
                              ? "bg-emerald-600 text-white"
                              : status === "current"
                              ? "bg-primary-600 text-white ring-4 ring-primary-100"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {status === "completed" ? "✓" : i + 1}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-1.5 ${
                            status === "current"
                              ? "text-primary-600"
                              : status === "completed"
                              ? "text-navy-900"
                              : "text-slate-400"
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  This booking was <strong>{booking.status.toLowerCase()}</strong>. Slots have been released.
                </span>
              </div>
            )}
          </div>

          {/* Counterpart Contact info card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {role === "CLIENT" ? "Assigned Professional" : "Client Information"}
            </h4>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={counterpart?.name || "User"}
                  src={counterpart?.avatarUrl}
                  size="md"
                  className="rounded-xl"
                />
                <div>
                  <h5 className="text-sm font-bold text-navy-900">{counterpart?.name}</h5>
                  <p className="text-xs text-slate-500">{counterpart?.email}</p>
                  {counterpart?.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {counterpart.phone}
                    </p>
                  )}
                </div>
              </div>

              <Link
                href={
                  role === "CLIENT"
                    ? `/client/messages?recipientId=${booking.workerId}`
                    : `/worker/messages`
                }
              >
                <Button size="sm" variant="outline" leftIcon={<MessageSquare className="w-3.5 h-3.5" />}>
                  Chat
                </Button>
              </Link>
            </div>
          </div>

          {/* Appointment Schedule & Reschedule */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scheduled Time & Location
              </h4>
              {canReschedule && !isRescheduling && (
                <button
                  onClick={() => setIsRescheduling(true)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Reschedule
                </button>
              )}
            </div>

            {!isRescheduling ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-medium">Date</span>
                  <span className="font-bold text-navy-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                    {formatDate(booking.bookingDate)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-medium">Time Window</span>
                  <span className="font-bold text-navy-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-600" />
                    {booking.timeSlot}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRescheduleSubmit} className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <span className="text-xs font-bold text-blue-900 block">Select New Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Date</label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Time Slot</label>
                    <Input
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      placeholder="e.g. 10:00 - 12:00 PM"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsRescheduling(false)}
                    disabled={rescheduleLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    isLoading={rescheduleLoading}
                  >
                    Confirm Reschedule
                  </Button>
                </div>
              </form>
            )}

            {booking.requestDetails && (
              <div className="text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-semibold block">Instructions from Client:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg mt-1 border border-slate-100">
                  {booking.requestDetails}
                </p>
              </div>
            )}
          </div>

          {/* Activity / Audit History */}
          {booking.activities && booking.activities.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Activity Log
              </h4>
              <div className="space-y-2.5">
                {booking.activities.map((act: any) => (
                  <div key={act.id} className="text-xs flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-navy-900">{act.details || act.action}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReport(true)}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200 text-xs"
              leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
            >
              Report an Issue
            </Button>

            {/* Worker Action Buttons for Status Transition */}
            {role === "WORKER" && (
              <div className="flex flex-wrap items-center gap-2">
                {booking.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange("DECLINED")}
                      isLoading={actionLoading}
                    >
                      Decline Request
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange("ACCEPTED")}
                      isLoading={actionLoading}
                    >
                      Accept Booking
                    </Button>
                  </>
                )}

                {booking.status === "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                    isLoading={actionLoading}
                  >
                    Mark Work in Progress
                  </Button>
                )}

                {booking.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleStatusChange("COMPLETED")}
                    isLoading={actionLoading}
                  >
                    Mark Completed
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Report an Issue Flow */}
      {booking && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          bookingId={booking.id}
          reportedUserId={role === "CLIENT" ? booking.workerId : booking.clientId}
          contextTitle={`${booking.service?.title || "Service"} (${booking.timeSlot})`}
        />
      )}
    </Modal>
  );
}
