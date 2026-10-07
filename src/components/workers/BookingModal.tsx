"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, DollarSign, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Input, Textarea } from "@/ui/Input";
import { formatCurrency } from "@/lib/utils";

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: {
    userId: string;
    name: string;
    services: Array<{
      id: string;
      title: string;
      price: number;
      durationMinutes: number;
      description?: string;
    }>;
  };
  currentUser: any;
  defaultServiceId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  worker,
  currentUser,
  defaultServiceId,
}) => {
  const router = useRouter();

  // Tomorrow's date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [selectedServiceId, setSelectedServiceId] = useState(
    defaultServiceId || worker.services[0]?.id || ""
  );
  const [bookingDate, setBookingDate] = useState(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 12:00 PM");
  const [requestDetails, setRequestDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedService = worker.services.find((s) => s.id === selectedServiceId);

  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "01:00 PM - 03:00 PM",
    "03:00 PM - 05:00 PM",
    "05:00 PM - 07:00 PM",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (currentUser.role !== "CLIENT" && currentUser.role !== "ADMIN") {
      setError("Only clients can book services. Please sign in with a Client account.");
      return;
    }

    if (!selectedServiceId || !bookingDate || !timeSlot || !requestDetails.trim()) {
      setError("Please complete all fields to book.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker.userId,
          serviceId: selectedServiceId,
          bookingDate,
          timeSlot,
          requestDetails: requestDetails.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/client/bookings");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Book Service with ${worker.name}`}
      description="Select your service, choose a date and time, and submit your request."
      maxWidth="lg"
    >
      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-navy-900">Booking Request Sent!</h3>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            {worker.name} has been notified and will review your request shortly. Redirecting to your bookings...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
              Select Service
            </label>
            <div className="space-y-2">
              {worker.services.map((svc) => (
                <label
                  key={svc.id}
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedServiceId === svc.id
                      ? "border-primary-600 bg-primary-50/50 ring-1 ring-primary-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="service"
                      value={svc.id}
                      checked={selectedServiceId === svc.id}
                      onChange={() => setSelectedServiceId(svc.id)}
                      className="mt-1 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{svc.title}</p>
                      {svc.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{svc.durationMinutes} mins
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-navy-900 shrink-0 ml-3">
                    {formatCurrency(svc.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                Preferred Date
              </label>
              <input
                type="date"
                value={bookingDate}
                min={defaultDateStr}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                Time Window
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <Textarea
              label="Job Description & Access Notes"
              placeholder="Describe what you need help with, any specific materials or instructions..."
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Pricing Summary */}
          {selectedService && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Service Price</span>
                <span className="font-semibold text-navy-900">
                  {formatCurrency(selectedService.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>WorkLink Trust & Protection</span>
                <span className="font-semibold text-emerald-600">Included</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-navy-900">
                <span>Total Estimated Cost</span>
                <span className="text-primary-600">{formatCurrency(selectedService.price)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Confirm Booking Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
