"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Skeleton, EmptyState } from "@/ui/Feedback";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function WorkerEarningsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => setPayments(data.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalEarnings = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingEarnings = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout role="WORKER">
      <div className="space-y-6">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 -mt-3.5 sm:-mt-6 lg:-mt-8 -mx-3.5 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">Earnings & Financials</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track revenue from completed client appointments and review payout logs.
          </p>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Revenue Paid
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totalEarnings)}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              Directly processed payments
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Payouts
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <Skeleton className="h-8 w-12" /> : formatCurrency(pendingEarnings)}
            </p>
            <span className="text-[11px] text-amber-600 mt-1 block">
              Pending release upon completion
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Platform Take Rate
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">0%</p>
            <span className="text-[11px] text-primary-600 mt-1 block">
              Keep 100% of your earnings
            </span>
          </Card>
        </div>

        {/* Payout Account Notice */}
        <Card className="p-5 bg-primary-50/40 border-primary-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-primary-200 flex items-center justify-center text-primary-600 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy-900">Direct Deposit & Payout Method</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Stripe Express Connect configured in Sandbox test mode. Production bank accounts can be connected anytime.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="bg-white">
            Payout Settings
          </Button>
        </Card>

        {/* Itemized Payments List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-navy-900">Payment Breakdown</h3>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : payments.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={<DollarSign className="w-6 h-6 text-slate-300" />}
                title="No Earnings Recorded Yet"
                description="Once clients book and pay for your services, individual receipts will be listed here."
              />
            </Card>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="md:hidden space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy-900 truncate">
                          {p.booking?.service?.title || "Booking Service"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Client: {p.client?.name || "Client"}
                        </p>
                      </div>
                      <Badge variant={p.status === "PAID" ? "success" : "warning"} size="sm">
                        {p.status}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{formatDate(p.createdAt)}</span>
                      <span className="text-sm font-extrabold text-emerald-600">
                        +{formatCurrency(p.amount, p.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-card">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-4">Service</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Gross Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-semibold text-navy-900">
                          {p.booking?.service?.title || "Booking"}
                        </td>
                        <td className="p-4">{p.client?.name || "Client"}</td>
                        <td className="p-4 text-slate-500">{formatDate(p.createdAt)}</td>
                        <td className="p-4 font-bold text-emerald-600">
                          +{formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="p-4">
                          <Badge variant={p.status === "PAID" ? "success" : "warning"} size="sm">
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
