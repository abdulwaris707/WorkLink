"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, User, Wrench, Mail, Lock, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card } from "@/ui/Card";
import { Skeleton } from "@/ui/Feedback";
import { AppLogo } from "@/ui/AppLogo";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "worker" ? "WORKER" : "CLIENT";

  const [role, setRole] = useState<"CLIENT" | "WORKER">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone,
          location,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      const dest = role === "WORKER" ? "/worker/profile" : "/client";
      router.push(dest);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 shadow-elevated border-slate-200/90">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Role Choice Pills */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole("CLIENT")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            role === "CLIENT"
              ? "border-primary-600 bg-primary-50/60 ring-2 ring-primary-100"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <User
            className={`w-5 h-5 mb-2 ${
              role === "CLIENT" ? "text-primary-600" : "text-slate-400"
            }`}
          />
          <p className="text-xs font-bold text-navy-900">I&apos;m a Client</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Looking to hire skilled pros</p>
        </button>

        <button
          type="button"
          onClick={() => setRole("WORKER")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            role === "WORKER"
              ? "border-primary-600 bg-primary-50/60 ring-2 ring-primary-100"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <Wrench
            className={`w-5 h-5 mb-2 ${
              role === "WORKER" ? "text-primary-600" : "text-slate-400"
            }`}
          />
          <p className="text-xs font-bold text-navy-900">I&apos;m a Worker</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Offer services & find jobs</p>
        </button>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Alex Morgan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="alex@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          required
        />

        <Input
          label="Password (min 6 characters)"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="(555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-3.5 h-3.5 text-slate-400" />}
          />
          <Input
            label="City / Location"
            placeholder="Seattle, WA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center mt-2"
          isLoading={loading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-600 hover:underline">
          Sign in
        </Link>
      </div>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center">
          <AppLogo size="lg" />
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-900 pt-2">
          Join the WorkLink Community
        </h2>
        <p className="text-xs text-slate-500">
          Select your account type to get started in seconds.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
