"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/ui/Feedback";
import { Button } from "@/ui/Button";
import { formatCurrency, formatDate, parseDateParts, getStatusColor } from "@/lib/utils";

export interface UpcomingAppointmentCardProps {
  booking: any;
  userRole: "CLIENT" | "WORKER";
  onViewDetails?: (booking: any) => void;
  className?: string;
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({
  booking,
  userRole,
  onViewDetails,
  className = "",
}) => {
  const statusColors = getStatusColor(booking.status);
  const dateParts = parseDateParts(booking.bookingDate);
  const isPaid = booking.paymentStatus === "PAID";

  const counterpart = userRole === "CLIENT" ? booking.worker : booking.client;
  const counterpartRole = userRole === "CLIENT" ? "Specialist" : "Client";
  const messageHref =
    userRole === "CLIENT"
      ? `/client/messages?recipientId=${booking.workerId}`
      : `/worker/messages?recipientId=${booking.clientId}`;
  const detailsHref = userRole === "CLIENT" ? "/client/bookings" : "/worker/bookings";

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-elevated transition-all overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* 1. Header Bar: Status, Payment Status, and Quoted Price */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS"
                  ? "bg-emerald-600 animate-pulse"
                  : booking.status === "PENDING"
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
            {booking.status.replace("_", " ")}
          </span>

          {isPaid ? (
            <span className="hidden xs:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
            </span>
          ) : (
            <span className="hidden xs:inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Payment Pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-right">
          <span className="text-[11px] text-slate-400 font-medium">Estimated:</span>
          <span className="text-sm sm:text-base font-extrabold text-navy-900">
            {formatCurrency(booking.quotedPrice)}
          </span>
        </div>
      </div>

      {/* 2. Middle Content Area: Date Ticket, Service Details, Counterpart */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
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

          {/* Details & Counterpart */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-navy-900 truncate">
              {booking.service?.title || "WorkLink Appointment"}
            </h4>

            {/* Counterpart info */}
            <div className="flex items-center gap-1.5 mt-1">
              <Avatar
                name={counterpart?.name || counterpartRole}
                src={counterpart?.avatarUrl}
                size="sm"
                className="w-5 h-5 rounded-md text-[10px]"
              />
              <span className="text-xs text-slate-600 font-medium truncate">
                {counterpartRole}:{" "}
                <strong className="text-navy-900 font-semibold">
                  {counterpart?.name || "Professional"}
                </strong>
              </span>
              {counterpart?.isVerified && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-primary-600 shrink-0"
                />
              )}
            </div>

            {/* Time Slot & Category Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{booking.timeSlot}</span>
              </div>

              {booking.service?.category && (
                <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {booking.service.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
          <Link href={messageHref} className="flex-1 sm:flex-none">
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs min-h-[38px] px-3.5 justify-center"
              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-slate-500" />}
            >
              Message
            </Button>
          </Link>

          {onViewDetails ? (
            <Button
              size="sm"
              variant="primary"
              className="flex-1 sm:flex-none w-full sm:w-auto text-xs min-h-[38px] px-3.5 justify-center"
              onClick={() => onViewDetails(booking)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Details
            </Button>
          ) : (
            <Link href={detailsHref} className="flex-1 sm:flex-none">
              <Button
                size="sm"
                variant="primary"
                className="w-full sm:w-auto text-xs min-h-[38px] px-3.5 justify-center"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
