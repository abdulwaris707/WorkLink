"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Briefcase,
  CalendarCheck,
  CreditCard,
  Star,
  AlertTriangle,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  ChevronRight,
  Database,
} from "lucide-react";
import { Avatar } from "@/ui/Feedback";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "ADMIN") {
          router.push("/jo");
        } else {
          setAdminUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        router.push("/jo");
      });
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/jo");
    router.refresh();
  };

  const navItems = [
    { label: "Dashboard", href: "/jo/dashboard", icon: LayoutDashboard },
    { label: "Verifications", href: "/jo/verifications", icon: ShieldCheck },
    { label: "User Accounts", href: "/jo/users", icon: Users },
    { label: "Worker Moderation", href: "/jo/workers", icon: Briefcase },
    { label: "Bookings Oversight", href: "/jo/bookings", icon: CalendarCheck },
    { label: "Payment Records", href: "/jo/payments", icon: CreditCard },
    { label: "Review Moderation", href: "/jo/reviews", icon: Star },
    { label: "Disputes & Reports", href: "/jo/reports", icon: AlertTriangle },
    { label: "Security Audit Logs", href: "/jo/audit-logs", icon: History },
    { label: "Settings", href: "/jo/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center animate-pulse">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Authenticating Administrative Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">WorkLink Console</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Restricted System
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/jo/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary-600 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* System & DB Status footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="px-2.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Neon Postgres</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={adminUser?.name || "Admin"} size="sm" className="rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{adminUser?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{adminUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-200 p-4 flex flex-col z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-bold text-white">WorkLink Console</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive ? "bg-primary-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-slate-800 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                WorkLink Operations
              </span>
              <h2 className="text-sm font-bold text-navy-900 truncate">
                {navItems.find((n) => pathname.startsWith(n.href))?.label || "Admin Console"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              RESTRICTED // ADMIN CONSOLE
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
