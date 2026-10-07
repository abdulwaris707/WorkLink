"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card } from "@/ui/Card";
import { Skeleton } from "@/ui/Feedback";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      const dest = redirect || data.redirectUrl || "/client";
      router.push(dest);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <Card className="p-6 sm:p-8 shadow-elevated border-slate-200/90">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center mt-2"
          isLoading={loading}
        >
          Sign In
        </Button>
      </form>

      {/* Quick Demo Credentials Fill Buttons */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
          One-Click Demo Accounts
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount("client@worklink.com")}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
          >
            <span className="text-[11px] font-bold text-navy-900 block truncate">Client Demo</span>
            <span className="text-[10px] text-slate-500 truncate block">client@worklink.com</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount("marcus@worklink.com")}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
          >
            <span className="text-[11px] font-bold text-navy-900 block truncate">Worker Demo</span>
            <span className="text-[10px] text-slate-500 truncate block">marcus@worklink.com</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="font-semibold text-primary-600 hover:underline">
          Create an account
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-navy-900">
            Work<span className="text-primary-600">Link</span>
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-900 pt-2">
          Sign in to your account
        </h2>
        <p className="text-xs text-slate-500">
          Access your bookings, messages, and services dashboard.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
