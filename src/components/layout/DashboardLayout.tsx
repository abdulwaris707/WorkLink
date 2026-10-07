"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  MoreHorizontal,
} from "lucide-react";
import { Avatar } from "@/ui/Feedback";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { AppLogo } from "@/ui/AppLogo";

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
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isHomeScreen = pathname === "/client" || pathname === "/worker";
  const isChat = pathname?.includes("/messages");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
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

    // Fetch unread messages count
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.conversations && Array.isArray(data.conversations)) {
          const totalUnread = data.conversations.reduce(
            (sum: number, c: any) => sum + (c._count?.messages || 0),
            0
          );
          setUnreadMessages(totalUnread);
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
    action?: string;
  }

  const clientNavItems: NavItem[] = [
    { label: "Home", href: "/client", icon: LayoutDashboard },
    { label: "Find Workers", href: "/workers", icon: Search },
    { label: "Smart Matches", href: "/client/recommendations", icon: Sparkles, badge: "Match" },
    { label: "My Bookings", href: "/client/bookings", icon: CalendarCheck },
    { label: "Messages", href: "/client/messages", icon: MessageSquare, count: unreadMessages },
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
    { label: "Messages", href: "/worker/messages", icon: MessageSquare, count: unreadMessages },
    { label: "Earnings", href: "/worker/earnings", icon: TrendingUp },
    { label: "Reviews", href: "/worker/reviews", icon: Star },
    { label: "Verification (CNIC)", href: "/worker/verification", icon: ShieldCheck },
    { label: "Profile", href: "/worker/profile", icon: User },
    { label: "Notifications", href: "/worker/notifications", icon: Bell, count: unreadNotifications },
    { label: "Settings", href: "/worker/settings", icon: Settings },
  ];

  const navItems = role === "WORKER" ? workerNavItems : clientNavItems;

  // 5 Native-App Bottom Bar Tabs
  const clientBottomTabs: NavItem[] = [
    { label: "Home", href: "/client", icon: LayoutDashboard },
    { label: "Explore", href: "/workers", icon: Search },
    { label: "Bookings", href: "/client/bookings", icon: CalendarCheck },
    { label: "Messages", href: "/client/messages", icon: MessageSquare, count: unreadMessages },
    { label: "More", href: "#more", icon: MoreHorizontal, count: unreadNotifications, action: "open_more" },
  ];

  const workerBottomTabs: NavItem[] = [
    { label: "Home", href: "/worker", icon: LayoutDashboard },
    { label: "Bookings", href: "/worker/bookings", icon: CalendarCheck },
    { label: "Schedule", href: "/worker/availability", icon: Clock },
    { label: "Messages", href: "/worker/messages", icon: MessageSquare, count: unreadMessages },
    { label: "More", href: "#more", icon: MoreHorizontal, count: unreadNotifications, action: "open_more" },
  ];

  const bottomNavItems = role === "WORKER" ? workerBottomTabs : clientBottomTabs;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-navy-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen shrink-0 sticky top-0 h-screen z-20 shadow-subtle">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <AppLogo size="sm" />
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-bold shadow-subtle"
                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-primary-600 stroke-[2.2]" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                    {item.count}
                  </span>
                ) : item.badge ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
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

      {/* Mobile Top App Header (Only visible on Home Screen of Client and Worker) */}
      {isHomeScreen && (
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2 flex items-center justify-between shadow-subtle">
          <Link href="/" className="flex items-center">
            <AppLogo size="sm" />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href={role === "WORKER" ? "/worker/notifications" : "/client/notifications"}
              className="p-2 text-slate-500 hover:text-navy-900 relative rounded-lg"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Drawer (Native Bottom/Side Sheet) */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs bg-white p-5 flex flex-col justify-between overflow-y-auto shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={user?.name || "User"} src={user?.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-navy-900 truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-navy-900"
                  >
                    <X className="w-5 h-5" />
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
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-primary-50 text-primary-700 font-bold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
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
                  className="w-full justify-center text-rose-600 hover:bg-rose-50 text-xs border-rose-200"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area (Protected bottom padding prevents native mobile bottom nav overlap) */}
      <main
        className={`flex-1 w-full overflow-x-hidden ${
          isChat
            ? "p-0 max-w-full pb-[76px] md:pb-0 h-[calc(100dvh-76px)] md:h-screen flex flex-col"
            : "p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-28 md:pb-8"
        }`}
      >
        {children}
      </main>

      {/* Polished Native-App Mobile Bottom Navigation Bar (PWA Experience) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(7,22,41,0.06)] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around h-[76px]"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isMoreTab = item.action === "open_more";
          const isActive =
            !isMoreTab &&
            (item.href === "/client" || item.href === "/worker"
              ? pathname === item.href
              : pathname.startsWith(item.href));

          const handleClick = (e: React.MouseEvent) => {
            if (isMoreTab) {
              e.preventDefault();
              setMobileNavOpen(true);
            }
          };

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleClick}
              className="relative flex flex-col items-center justify-center min-w-[58px] min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 active:scale-95"
            >
              {/* Framer motion active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-primary-50 rounded-xl"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors ${
                      isActive
                        ? "text-primary-600 stroke-[2.3]"
                        : "text-slate-400 stroke-[1.8]"
                    }`}
                  />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {item.count > 9 ? "9+" : item.count}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold tracking-tight transition-colors ${
                    isActive ? "text-primary-700 font-bold" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
