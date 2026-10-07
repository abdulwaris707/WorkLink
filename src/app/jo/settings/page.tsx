"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Lock,
  Database,
  Terminal,
  Server,
  User,
  Key,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Administrative Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System environment information and administrative access protocols.
          </p>
        </div>

        {/* Current Admin Account */}
        <Card className="p-5 bg-white border-slate-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary-600" /> Active Administrator Session
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Administrator Name</span>
              <p className="font-semibold text-navy-900 text-sm mt-0.5">{user?.name || "Loading..."}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Authenticated Email</span>
              <p className="font-semibold text-navy-900 text-sm mt-0.5">{user?.email || "Loading..."}</p>
            </div>
          </div>
        </Card>

        {/* Platform Architecture & Security Protocols */}
        <Card className="p-5 bg-white border-slate-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-600" /> Active Security Controls
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-navy-900">Database Engine</p>
                <p className="text-[11px] text-slate-500">Neon Serverless PostgreSQL (Drizzle ORM)</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Connected
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-navy-900">Hidden Admin Path Protection</p>
                <p className="text-[11px] text-slate-500">Middleware guards on /jo/* with automatic 403 / redirect</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Enforced
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-navy-900">Search Engine Indexing Prevention</p>
                <p className="text-[11px] text-slate-500">noindex, nofollow metadata active on /jo routes</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-navy-900">Admin Login Rate Limiting</p>
                <p className="text-[11px] text-slate-500">Sliding window throttle (max 5 failed attempts per IP)</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
          </div>
        </Card>

        {/* Safe CLI Instruction for Adding Admins */}
        <Card className="p-5 bg-white border-slate-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary-600" /> CLI Administrator Provisioning
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Administrators can never be created via public sign-up. To create or promote an admin safely on Neon, run the
            dedicated server script:
          </p>

          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs overflow-x-auto">
            <code>npx tsx scripts/create-admin.ts email@domain.com &quot;Admin Name&quot; &quot;SecurePassword123!&quot;</code>
          </div>

          <p className="text-[11px] text-slate-400">
            Or to promote an existing user in SQL:
            <br />
            <code className="text-slate-600">UPDATE users SET role = &apos;ADMIN&apos; WHERE email = &apos;user@domain.com&apos;;</code>
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
