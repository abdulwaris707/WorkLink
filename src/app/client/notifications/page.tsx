"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  MessageSquare,
  CreditCard,
  Star,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Skeleton } from "@/ui/Feedback";

export default function ClientNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Failed
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BOOKING_ACCEPTED":
      case "BOOKING_COMPLETED":
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case "BOOKING_DECLINED":
      case "BOOKING_CANCELLED":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "NEW_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-primary-600" />;
      case "PAYMENT_UPDATE":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case "REVIEW_RECEIVED":
        return <Star className="w-4 h-4 text-amber-500" />;
      case "VERIFICATION_UPDATE":
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout role="CLIENT">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold tracking-tight text-navy-900">
                Notifications & Alerts
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Stay updated on booking milestones, messages, and payment activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              className="text-xs self-start sm:self-center"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark All as Read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No Notifications</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You are all caught up! Updates regarding your bookings and messages will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                hoverEffect
                className={`p-4 transition-all ${
                  notif.isRead ? "bg-white" : "bg-primary-50/30 border-primary-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-navy-900">{notif.title}</h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <Link href={notif.link} className="shrink-0">
                      <Button size="sm" variant="outline" className="text-[11px] px-2.5 py-1">
                        View <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
