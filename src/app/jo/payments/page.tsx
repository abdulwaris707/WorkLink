"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Building,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Skeleton, EmptyState } from "@/ui/Feedback";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = `/api/jo/payments${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const tabs = [
    { label: "All Transactions", val: "ALL" },
    { label: "Paid", val: "PAID" },
    { label: "Pending", val: "PENDING" },
    { label: "Failed", val: "FAILED" },
    { label: "Refunded", val: "REFUNDED" },
  ];

  const totalVolume = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Payment Ledger Oversight</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified financial records, provider transaction IDs, and settlement statuses from Neon PostgreSQL.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-700 font-medium">Filtered Paid Total: </span>
            <span className="font-extrabold text-emerald-900">{formatCurrency(totalVolume)}</span>
          </div>
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

        {/* Payments Table */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : payments.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<CreditCard className="w-8 h-8 text-slate-300" />}
              title="No Payment Records"
              description="No transaction logs match the selected filter parameters."
            />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {payments.map((p) => (
              <Card
                key={p.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-slate-200"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 font-bold">#{p.id.slice(0, 8)}</span>
                    <span className="font-bold text-sm text-navy-900">
                      {p.booking?.service?.title || "Custom Service"}
                    </span>
                    <Badge
                      variant={
                        p.status === "PAID"
                          ? "success"
                          : p.status === "FAILED"
                          ? "error"
                          : p.status === "REFUNDED"
                          ? "outline"
                          : "warning"
                      }
                      size="sm"
                    >
                      {p.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Client: <strong className="text-navy-900">{p.client.name}</strong> • Worker:{" "}
                    <strong className="text-navy-900">{p.worker.name}</strong>
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span>Txn: {p.providerPaymentId || "n/a"}</span>
                    <span>Provider: {p.provider}</span>
                    <span>{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Settled Amount</span>
                  <span className="text-xl font-extrabold text-navy-900">
                    {formatCurrency(p.amount)} {p.currency}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
