"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Search,
  Sparkles,
  CalendarCheck,
  MessageSquare,
  CreditCard,
  Star,
  Settings,
  Layers,
  Clock,
  TrendingUp,
  User,
  ShieldCheck,
  Bell,
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // Check role alignment
          if (role === "CLIENT" && data.user.role === "WORKER") {
            router.push("/worker");
          } else if (role === "WORKER" && data.user.role === "CLIENT") {
            router.push("/client");
          }
        } else {
          router.push(`/login?redirect=${pathname}`);
        }
      })
      .catch(() => {});

    // Fetch notifications count
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications && Array.isArray(data.notifications)) {
          const unread = data.notifications.filter((n: any) => !n.isRead).length;
          setUnreadNotifications(unread);
        }
      })
      .catch(() => {});
  }, [pathname, role, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: string;
    count?: number;
  }

  const clientNavItems: NavItem[] = [
    { label: "Home", href: "/client", icon: LayoutDashboard },
    { label: "Find Workers", href: "/workers", icon: Search },
    { label: "Smart Recommendations", href: "/client/recommendations", icon: Sparkles, badge: "Match" },
    { label: "My Bookings", href: "/client/bookings", icon: CalendarCheck },
    { label: "Messages", href: "/client/messages", icon: MessageSquare },
    { label: "Payments", href: "/client/payments", icon: CreditCard },
    { label: "Reviews", href: "/client/reviews", icon: Star },
    { label: "Notifications", href: "/client/notifications", icon: Bell, count: unreadNotifications },
    { label: "Settings", href: "/client/settings", icon: Settings },
  ];

  const workerNavItems: NavItem[] = [
    { label: "Home", href: "/worker", icon: LayoutDashboard },
    { label: "Services", href: "/worker/services", icon: Layers },
    { label: "Booking Requests", href: "/worker/bookings", icon: CalendarCheck },
    { label: "Schedule / Availability", href: "/worker/availability", icon: Clock },
    { label: "Messages", href: "/worker/messages", icon: MessageSquare },
    { label: "Earnings", href: "/worker/earnings", icon: TrendingUp },
    { label: "Reviews", href: "/worker/reviews", icon: Star },
    { label: "Verification (CNIC)", href: "/worker/verification", icon: ShieldCheck },
    { label: "Profile", href: "/worker/profile", icon: User },
    { label: "Notifications", href: "/worker/notifications", icon: Bell, count: unreadNotifications },
    { label: "Settings", href: "/worker/settings", icon: Settings },
  ];

  const navItems = role === "WORKER" ? workerNavItems : clientNavItems;

  // Mobile Bottom Bar primary items
  const clientBottomItems: NavItem[] = [
    { label: "Home", href: "/client", icon: LayoutDashboard },
    { label: "Matches", href: "/client/recommendations", icon: Sparkles },
    { label: "Bookings", href: "/client/bookings", icon: CalendarCheck },
    { label: "Messages", href: "/client/messages", icon: MessageSquare },
    { label: "Alerts", href: "/client/notifications", icon: Bell, count: unreadNotifications },
  ];

  const workerBottomItems: NavItem[] = [
    { label: "Home", href: "/worker", icon: LayoutDashboard },
    { label: "Bookings", href: "/worker/bookings", icon: CalendarCheck },
    { label: "Schedule", href: "/worker/availability", icon: Clock },
    { label: "Messages", href: "/worker/messages", icon: MessageSquare },
    { label: "Verify", href: "/worker/verification", icon: ShieldCheck },
  ];

  const bottomNavItems = role === "WORKER" ? workerBottomItems : clientBottomItems;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen shrink-0 sticky top-0 h-screen z-20">
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
            {role === "WORKER" ? "Worker" : "Client"}
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-bold"
                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-primary-600" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                    {item.count}
                  </span>
                ) : item.badge ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                    {item.badge}
                  </span>
                ) : null}
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

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-navy-900 text-sm">WorkLink</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={role === "WORKER" ? "/worker/notifications" : "/client/notifications"}
            className="p-2 text-slate-500 hover:text-navy-900 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </Link>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 text-navy-900 rounded-lg hover:bg-slate-100"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Full Menu) */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm">
          <div className="bg-white w-4/5 max-w-xs h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={user?.name || "User"} src={user?.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-900 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
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
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-center text-rose-600 hover:bg-rose-50 text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (padding bottom on mobile accounts for fixed bottom bar) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (PWA Experience) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-2 flex items-center justify-around shadow-elevated">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/client" || item.href === "/worker"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative min-w-[54px] ${
                isActive ? "text-primary-600 font-bold" : "text-slate-500 hover:text-navy-900"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-600 stroke-[2.3]" : "text-slate-400"}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
