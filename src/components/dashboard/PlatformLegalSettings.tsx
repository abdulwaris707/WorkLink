"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  ExternalLink,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/ui/Card";
import { AppLogo } from "@/ui/AppLogo";

export const PlatformLegalSettings: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Card className="p-6 sm:p-8 space-y-6">
      {/* Brand & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <AppLogo size="sm" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
            WorkLink is the trusted marketplace connecting vetted, skilled trade & digital service
            professionals with quality clients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <ShieldCheck className="w-3.5 h-3.5" /> Vetted Workers
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
            <Star className="w-3.5 h-3.5" /> Verified Reviews
          </span>
        </div>
      </div>

      {/* Trust, Legal & Policy Sections (Accordion) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
          Trust, Safety & Legal Information
        </h4>

        {/* How WorkLink Works */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
          <button
            onClick={() => toggleSection("how-it-works")}
            className="w-full px-4 py-3 text-left flex items-center justify-between font-bold text-xs text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600" /> How WorkLink Works
            </span>
            {openSection === "how-it-works" ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === "how-it-works" && (
            <div className="p-4 pt-0 text-xs text-slate-600 space-y-2 border-t border-slate-100 bg-white">
              <p>
                <strong>1. Discover:</strong> Browse verified professionals or filter by rating, trade, and location.
              </p>
              <p>
                <strong>2. Book & Chat:</strong> Schedule a service date with transparent upfront pricing and communicate directly via real-time messaging.
              </p>
              <p>
                <strong>3. Escrow Security:</strong> Payments are authorized securely in escrow and only disbursed to workers once the job is completed to satisfaction.
              </p>
              <p>
                <strong>4. Review:</strong> Leave public feedback and ratings to reward top craftsmanship and maintain community standards.
              </p>
            </div>
          )}
        </div>

        {/* Trust & Safety Guarantee */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
          <button
            onClick={() => toggleSection("trust-safety")}
            className="w-full px-4 py-3 text-left flex items-center justify-between font-bold text-xs text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Trust & Safety Guarantee
            </span>
            {openSection === "trust-safety" ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === "trust-safety" && (
            <div className="p-4 pt-0 text-xs text-slate-600 space-y-2 border-t border-slate-100 bg-white">
              <p>
                Every active worker profile undergoes identity verification (official government ID / CNIC verification) and skills screening before accepting client bookings.
              </p>
              <p>
                In the event of an unfulfilled service, property dispute, or payment issue, our 24/7 dedicated moderation desk intervenes to mediate resolutions or issue appropriate refunds.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Policy */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
          <button
            onClick={() => toggleSection("privacy")}
            className="w-full px-4 py-3 text-left flex items-center justify-between font-bold text-xs text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" /> Privacy & Data Policy
            </span>
            {openSection === "privacy" ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === "privacy" && (
            <div className="p-4 pt-0 text-xs text-slate-600 space-y-2 border-t border-slate-100 bg-white">
              <p>
                Your privacy is paramount. Phone numbers, addresses, and chat history are strictly shared only between confirmed booking parties and never sold to third-party brokers.
              </p>
              <p>
                Authentication credentials, session tokens, and financial transactions are encrypted using industry-standard TLS 1.3 and stored securely in certified databases.
              </p>
            </div>
          )}
        </div>

        {/* Terms of Service */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
          <button
            onClick={() => toggleSection("terms")}
            className="w-full px-4 py-3 text-left flex items-center justify-between font-bold text-xs text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" /> Terms of Service
            </span>
            {openSection === "terms" ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSection === "terms" && (
            <div className="p-4 pt-0 text-xs text-slate-600 space-y-2 border-t border-slate-100 bg-white">
              <p>
                By using WorkLink, users agree to respectful communication, timely arrival for scheduled appointments, and adherence to marketplace fair-work pricing.
              </p>
              <p>
                Cancellations made within 2 hours of a scheduled arrival time may incur a nominal cancellation fee to compensate the provider for travel and preparation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3">
          Marketplace Shortcuts
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link
            href="/workers"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 font-semibold text-slate-700 transition-colors text-center"
          >
            Find Workers
          </Link>
          <Link
            href="/workers?category=Home+Services"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 font-semibold text-slate-700 transition-colors text-center"
          >
            Home Services
          </Link>
          <Link
            href="/workers?category=Cleaning"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 font-semibold text-slate-700 transition-colors text-center"
          >
            Cleaning Pros
          </Link>
          <Link
            href="/workers?category=Repairs"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 font-semibold text-slate-700 transition-colors text-center"
          >
            Repairs
          </Link>
        </div>
      </div>

      {/* Copyright & Version Info */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>© {new Date().getFullYear()} WorkLink Platform Inc. All rights reserved.</span>
        <span>Version 2.4.0 (PWA Mobile Edition)</span>
      </div>
    </Card>
  );
};
