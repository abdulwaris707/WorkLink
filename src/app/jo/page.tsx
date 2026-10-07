"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Card } from "@/ui/Card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role === "ADMIN") {
          router.replace("/jo/dashboard");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jo/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      router.replace(data.redirect || "/jo/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center animate-pulse">
          <Lock className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold tracking-tight text-white">
          WorkLink Management Console
        </h2>
        <p className="mt-1 text-center text-xs font-mono text-slate-500 uppercase tracking-widest">
          Restricted // Authorized Personnel Only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Administrator Identifier
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-2.5 font-semibold text-xs tracking-wide uppercase"
                isLoading={loading}
                disabled={loading}
              >
                Authenticate Session
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block">
              Audit logging and IP tracing active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
