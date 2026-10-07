"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  Download,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Modal } from "@/ui/Modal";
import { Skeleton, EmptyState, CardLoader, CardTextLoader } from "@/ui/Feedback";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [unpaidBookings, setUnpaidBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalBooking, setPaymentModalBooking] = useState<any | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/bookings"),
      ]);

      const [pData, bData] = await Promise.all([paymentsRes.json(), bookingsRes.json()]);

      setPayments(pData.payments || []);
      const unpaid = (bData.bookings || []).filter(
        (b: any) =>
          b.paymentStatus === "PENDING" &&
          (b.status === "ACCEPTED" || b.status === "IN_PROGRESS" || b.status === "COMPLETED")
      );
      setUnpaidBookings(unpaid);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout role="CLIENT">
      <div className="space-y-6">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 -mt-3.5 sm:-mt-6 lg:-mt-8 -mx-3.5 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">Payments & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your past invoices, verify payment IDs, and complete open balances.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Paid to Date
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? <CardTextLoader size="xs" /> : formatCurrency(totalPaid)}
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              {payments.length} successful transactions
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Balances
            </span>
            <p className="text-2xl font-bold text-navy-900 mt-2">
              {loading ? (
                <CardTextLoader size="xs" />
              ) : (
                unpaidBookings.length
              )}
            </p>
            <span className="text-[11px] text-amber-600 mt-1 block">
              {unpaidBookings.length > 0 ? "Awaiting client checkout" : "All payments current"}
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Protection Guarantee
            </span>
            <p className="text-sm font-bold text-navy-900 mt-2 flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> 100% Secure Processing
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Payments held until work confirmation
            </span>
          </Card>
        </div>

        {/* Unpaid Bookings Action Notice */}
        {unpaidBookings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Pending Payments
            </h3>
            <div className="space-y-3">
              {unpaidBookings.map((b) => (
                <Card
                  key={b.id}
                  className="p-4 border-amber-200/80 bg-amber-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-bold text-navy-900">{b.service.title}</h4>
                    <p className="text-xs text-slate-500">
                      Pro: {b.worker.name} • Scheduled: {formatDate(b.bookingDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-navy-900">
                      {formatCurrency(b.quotedPrice)}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setPaymentModalBooking(b)}
                    >
                      Pay Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Transactions Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-navy-900">Payment History</h3>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <CardLoader size="lg" text="Loading payment records..." />
            </div>
          ) : payments.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={<CreditCard className="w-6 h-6 text-slate-300" />}
                title="No Invoices Yet"
                description="When you book and pay for services, your itemized receipts will show here."
              />
            </Card>
          ) : (
            <>
              {/* Mobile Card List (< md) */}
              <div className="md:hidden space-y-3">
                {payments.map((p) => {
                  const statusColors = getStatusColor(p.status);
                  return (
                    <Card key={p.id} className="p-4 border-slate-200/90 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-navy-900">
                            {p.booking?.service?.title || "WorkLink Booking"}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pro: {p.worker?.name || "Professional"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Amount Paid</span>
                          <span className="text-sm font-bold text-navy-900">
                            {formatCurrency(p.amount, p.currency)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[36px] text-xs px-3"
                          onClick={() => setReceiptPayment(p)}
                          leftIcon={<FileText className="w-3.5 h-3.5" />}
                        >
                          View Receipt
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-card">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-4">Transaction / Service</th>
                      <th className="p-4">Worker</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => {
                      const statusColors = getStatusColor(p.status);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 font-semibold text-navy-900">
                            {p.booking?.service?.title || "WorkLink Booking"}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Ref: {p.providerPaymentId || p.id.substring(0, 8)}
                            </span>
                          </td>
                          <td className="p-4">{p.worker?.name || "Professional"}</td>
                          <td className="p-4 text-slate-500">{formatDate(p.createdAt)}</td>
                          <td className="p-4 font-bold text-navy-900">
                            {formatCurrency(p.amount, p.currency)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setReceiptPayment(p)}
                              leftIcon={<FileText className="w-3.5 h-3.5" />}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Processing Modal */}
      {paymentModalBooking && (
        <PaymentModal
          isOpen={Boolean(paymentModalBooking)}
          onClose={() => setPaymentModalBooking(null)}
          booking={paymentModalBooking}
          onSuccess={fetchData}
        />
      )}

      {/* Receipt Preview Dialog */}
      {receiptPayment && (
        <Modal
          isOpen={Boolean(receiptPayment)}
          onClose={() => setReceiptPayment(null)}
          title="Payment Receipt"
          maxWidth="sm"
        >
          <div className="space-y-4 pt-1 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span>Receipt Number:</span>
                <span className="font-mono text-navy-900 font-semibold">
                  {receiptPayment.id.substring(0, 12).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Reference:</span>
                <span className="font-mono text-navy-900 font-semibold">
                  {receiptPayment.providerPaymentId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="text-navy-900">{formatDate(receiptPayment.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid To:</span>
                <span className="text-navy-900 font-semibold">{receiptPayment.worker?.name}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-100 py-3 space-y-1.5">
              <div className="flex justify-between">
                <span>{receiptPayment.booking?.service?.title || "Service Delivered"}</span>
                <span className="font-bold text-navy-900">
                  {formatCurrency(receiptPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Method:</span>
                <span>Encrypted Card (Stripe Test)</span>
              </div>
            </div>

            <div className="flex justify-between text-sm font-bold text-navy-900">
              <span>Total Paid</span>
              <span className="text-emerald-600">{formatCurrency(receiptPayment.amount)}</span>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => setReceiptPayment(null)}
              >
                Close Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
