"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Briefcase,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/ui/Button";
import { Avatar } from "@/ui/Feedback";
import { Badge } from "@/ui/Badge";

interface NavbarProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser: initialUser }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(initialUser || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync auth state
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setUnreadCount(data.unreadNotifications || 0);
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch {}
  };

  const handleToggleNotifications = () => {
    if (!notificationsOpen) {
      fetchNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const dashboardHref = user?.role === "WORKER" ? "/worker" : "/client";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NextLink href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm group-hover:bg-primary-700 transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-navy-900">
            Work<span className="text-primary-600">Link</span>
          </span>
        </NextLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-navy-700">
          <NextLink
            href="/workers"
            className="hover:text-primary-600 transition-colors flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-slate-400" />
            Find Workers
          </NextLink>
          <NextLink href="/#how-it-works" className="hover:text-primary-600 transition-colors">
            How It Works
          </NextLink>
          <NextLink href="/#for-workers" className="hover:text-primary-600 transition-colors">
            For Workers
          </NextLink>
        </nav>

        {/* Right CTA / Auth Profile */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifications}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-elevated p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-navy-900">Notifications</h4>
                        {unreadCount > 0 && (
                          <Badge variant="info" size="sm">
                            {unreadCount} new
                          </Badge>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary-600 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto my-2">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-6">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <NextLink
                            key={n.id}
                            href={n.link || "#"}
                            onClick={() => setNotificationsOpen(false)}
                            className={`block p-2.5 rounded-xl hover:bg-slate-50 transition-colors ${
                              !n.isRead ? "bg-primary-50/40" : ""
                            }`}
                          >
                            <p className="text-xs font-semibold text-navy-900">{n.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          </NextLink>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Link */}
              <NextLink
                href={dashboardHref}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <div className="text-left">
                  <p className="text-xs font-bold text-navy-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
              </NextLink>

              <NextLink href={dashboardHref}>
                <Button size="sm" variant="primary">
                  Dashboard
                </Button>
              </NextLink>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <NextLink href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </NextLink>
              <NextLink href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </NextLink>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={handleToggleNotifications}
              className="relative p-2 rounded-lg text-slate-600"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-navy-800 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <NextLink
            href="/workers"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 text-sm font-medium text-navy-800 hover:text-primary-600"
          >
            <Search className="w-4 h-4 text-slate-400" />
            Find Workers
          </NextLink>
          <NextLink
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-navy-800 hover:text-primary-600"
          >
            How It Works
          </NextLink>
          <NextLink
            href="/#for-workers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-navy-800 hover:text-primary-600"
          >
            For Workers
          </NextLink>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <NextLink
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 text-sm font-semibold text-navy-900"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  <span>Go to {user.role === "WORKER" ? "Worker" : "Client"} Dashboard</span>
                </NextLink>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <NextLink href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Log In
                  </Button>
                </NextLink>
                <NextLink href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign Up
                  </Button>
                </NextLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
