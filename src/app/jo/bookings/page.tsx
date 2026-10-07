"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  History,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Input";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export default function AdminBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected booking for inspection & intervention
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [interventionStatus, setInterventionStatus] = useState("COMPLETED");
  const [interventionReason, setInterventionReason] = useState("");
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = `/api/jo/bookings${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`;
      const res = await fetch(url);
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
  }, [statusFilter]);

  const handleInterventionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/jo/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          status: interventionStatus,
          reason: interventionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Intervention failed");
      }

      toast.success("Booking Overridden", `Booking status updated to ${interventionStatus}.`);
      setInterventionModalOpen(false);
      setSelectedBooking(null);
      setInterventionReason("");
      fetchBookings();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { label: "All Bookings", val: "ALL" },
    { label: "Pending", val: "PENDING" },
    { label: "Accepted", val: "ACCEPTED" },
    { label: "In Progress", val: "IN_PROGRESS" },
    { label: "Completed", val: "COMPLETED" },
    { label: "Cancelled", val: "CANCELLED" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Booking Pipeline Oversight</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit job progression, review client-worker commitments, and enforce administrative overrides with audit trails.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          {tabs.map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                statusFilter === tab.val ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<CalendarCheck className="w-8 h-8 text-slate-300" />}
              title="No Bookings in This State"
              description="No booking records match the current filter selection."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const statusColors = getStatusColor(b.status);
              const isPaid = b.paymentStatus === "PAID";
              return (
                <Card
                  key={b.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border-slate-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400 font-bold">#{b.id.slice(0, 8)}</span>
                      <h3 className="font-bold text-sm text-navy-900">{b.service.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isPaid ? "Paid" : "Payment Pending"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Client</span>
                        <p className="font-semibold text-navy-900">{b.client.name}</p>
                        <p className="text-[11px] text-slate-400">{b.client.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Worker</span>
                        <p className="font-semibold text-navy-900">{b.worker.name}</p>
                        <p className="text-[11px] text-slate-400">{b.worker.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Schedule & Price</span>
                        <p className="font-semibold text-navy-900">
                          {formatDate(b.bookingDate)} • {b.timeSlot}
                        </p>
                        <p className="font-bold text-primary-700">{formatCurrency(b.quotedPrice)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedBooking(b);
                        setInterventionStatus(b.status === "PENDING" ? "ACCEPTED" : "COMPLETED");
                        setInterventionModalOpen(true);
                      }}
                    >
                      Admin Override
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Admin Intervention Modal */}
        {selectedBooking && interventionModalOpen && (
          <Modal
            isOpen={interventionModalOpen}
            onClose={() => setInterventionModalOpen(false)}
            title="Administrative Booking Override"
            description={`Booking #${selectedBooking.id.slice(0, 8)} • Current: ${selectedBooking.status}`}
            maxWidth="sm"
          >
            <form onSubmit={handleInterventionSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Status</label>
                <select
                  value={interventionStatus}
                  onChange={(e) => setInterventionStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ACCEPTED">ACCEPTED (Force Accept)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Force Active)</option>
                  <option value="COMPLETED">COMPLETED (Force Complete)</option>
                  <option value="CANCELLED">CANCELLED (Administrative Cancellation)</option>
                  <option value="DECLINED">DECLINED (Force Decline)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Intervention <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder="e.g. Dispute resolved via client call, manual confirmation of service delivered..."
                  value={interventionReason}
                  onChange={(e) => setInterventionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInterventionModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Confirm Override
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
