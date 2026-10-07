"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Search,
  CalendarCheck,
  MessageSquare,
  CreditCard,
  Star,
  Settings,
  Layers,
  Clock,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/ui/Feedback";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "CLIENT" | "WORKER";
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push(`/login?redirect=${pathname}`);
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const clientNavItems = [
    { label: "Overview", href: "/client", icon: LayoutDashboard },
    { label: "Find Workers", href: "/workers", icon: Search },
    { label: "My Bookings", href: "/client/bookings", icon: CalendarCheck },
    { label: "Messages", href: "/client/messages", icon: MessageSquare },
    { label: "Payments", href: "/client/payments", icon: CreditCard },
    { label: "Reviews", href: "/client/reviews", icon: Star },
    { label: "Settings", href: "/client/settings", icon: Settings },
  ];

  const workerNavItems = [
    { label: "Overview", href: "/worker", icon: LayoutDashboard },
    { label: "My Services", href: "/worker/services", icon: Layers },
    { label: "Bookings", href: "/worker/bookings", icon: CalendarCheck },
    { label: "Messages", href: "/worker/messages", icon: MessageSquare },
    { label: "Availability", href: "/worker/availability", icon: Clock },
    { label: "Earnings", href: "/worker/earnings", icon: TrendingUp },
    { label: "Reviews", href: "/worker/reviews", icon: Star },
    { label: "Profile", href: "/worker/profile", icon: User },
    { label: "Settings", href: "/worker/settings", icon: Settings },
  ];

  const navItems = role === "WORKER" ? workerNavItems : clientNavItems;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-navy-900">
              Work<span className="text-primary-600">Link</span>
            </span>
          </Link>
          <Badge variant={role === "WORKER" ? "info" : "success"} size="sm">
            {role === "WORKER" ? "Pro" : "Client"}
          </Badge>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/client" || item.href === "/worker"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-primary-600" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Worker Public Profile Quick Link */}
        {role === "WORKER" && user?.workerProfile?.slug && (
          <div className="px-3 pb-2">
            <Link
              href={`/workers/${user.workerProfile.slug}`}
              target="_blank"
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View Public Profile
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Bottom User info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name || "User"} src={user?.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-navy-900 truncate">{user?.name || "Loading..."}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-navy-900">WorkLink</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={role === "WORKER" ? "info" : "success"} size="sm">
            {role === "WORKER" ? "Worker" : "Client"}
          </Badge>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 text-navy-900 rounded-lg hover:bg-slate-100"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-sm">
          <div className="bg-white w-4/5 max-w-sm h-full p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={user?.name || "User"} src={user?.avatarUrl} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-navy-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <button onClick={() => setMobileNavOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/client" || item.href === "/worker"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
