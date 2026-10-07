"use client";

import React, { useState } from "react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Lock, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/ui/Badge";

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    quotedPrice: number;
    service: { title: string };
    worker: { name: string };
  };
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paidSuccess, setPaidSuccess] = useState(false);

  const fillTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/28");
    setCvc("123");
    setError("");
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          cardNumber,
          cardExpiry: expiry,
          cardCvc: cvc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setPaidSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Secure Checkout"
      description="Pay for your confirmed service via encrypted checkout."
      maxWidth="md"
    >
      {paidSuccess ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-navy-900">Payment Successful!</h4>
          <p className="text-xs text-slate-500">
            Receipt generated and your booking status is updated to Paid.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-navy-900">{booking.service.title}</p>
              <p className="text-[11px] text-slate-500">Worker: {booking.worker.name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Due</span>
              <span className="text-base font-bold text-navy-900">
                {formatCurrency(booking.quotedPrice)}
              </span>
            </div>
          </div>

          {/* Test Mode Banner */}
          <div className="p-3 rounded-xl bg-primary-50/60 border border-primary-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-medium text-primary-800">
                Test Mode: Stripe Sandbox Simulation
              </span>
            </div>
            <button
              type="button"
              onClick={fillTestCard}
              className="text-xs font-bold text-primary-700 hover:underline"
            >
              Fill Test Card
            </button>
          </div>

          <div>
            <Input
              label="Card Number"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              leftIcon={<CreditCard className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiration"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
            <Input
              label="CVC / CVV"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit SSL encrypted transaction. No plain card data is stored.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Pay {formatCurrency(booking.quotedPrice)}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
