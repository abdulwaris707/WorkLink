"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useToast } from "@/ui/Toast";

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const defaultDays: DaySchedule[] = [
  { dayOfWeek: 1, dayName: "Monday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { dayOfWeek: 2, dayName: "Tuesday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { dayOfWeek: 3, dayName: "Wednesday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { dayOfWeek: 4, dayName: "Thursday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { dayOfWeek: 5, dayName: "Friday", enabled: true, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 6, dayName: "Saturday", enabled: true, startTime: "09:00", endTime: "14:00" },
  { dayOfWeek: 0, dayName: "Sunday", enabled: false, startTime: "09:00", endTime: "13:00" },
];

export default function WorkerAvailabilityPage() {
  const toast = useToast();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultDays);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const [availRes, profileRes] = await Promise.all([
          fetch("/api/availability"),
          fetch("/api/profile"),
        ]);

        const [aData, pData] = await Promise.all([availRes.json(), profileRes.json()]);

        if (pData.profile?.workerProfile) {
          setIsAvailable(pData.profile.workerProfile.isAvailable);
        }

        if (aData.schedule && aData.schedule.length > 0) {
          const updated = defaultDays.map((d) => {
            const match = aData.schedule.find((s: any) => s.dayOfWeek === d.dayOfWeek);
            if (match) {
              return {
                ...d,
                enabled: !match.isBlocked,
                startTime: match.startTime || d.startTime,
                endTime: match.endTime || d.endTime,
              };
            }
            return { ...d, enabled: false };
          });
          setSchedule(updated);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  const handleDayToggle = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    val: string
  ) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: val } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slots = schedule
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          isBlocked: false,
        }));

      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots,
          isAvailable,
        }),
      });

      if (!res.ok) throw new Error("Failed to save availability");
      toast.success("Schedule Saved", "Your updated working hours are now active.");
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="WORKER">
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Working Hours & Availability</h1>
          <p className="text-xs text-slate-500 mt-1">
            Define the days and hours you accept client bookings.
          </p>
        </div>

        {/* Global Acceptance Toggle */}
        <Card className="p-5 flex items-center justify-between border-slate-200/90">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy-900">Accepting New Bookings</h3>
              <Badge variant={isAvailable ? "success" : "warning"} size="sm">
                {isAvailable ? "Available" : "Paused"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn off if you are fully booked or on vacation to prevent new client requests.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </Card>

        {/* Weekly Schedule */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-navy-900 pb-3 border-b border-slate-100">
            Weekly Operating Schedule
          </h3>

          <div className="divide-y divide-slate-100">
            {schedule.map((day) => (
              <div
                key={day.dayOfWeek}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={() => handleDayToggle(day.dayOfWeek)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span
                    className={`text-xs font-bold ${
                      day.enabled ? "text-navy-900" : "text-slate-400"
                    }`}
                  >
                    {day.dayName}
                  </span>
                </div>

                {day.enabled ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">From</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        handleTimeChange(day.dayOfWeek, "startTime", e.target.value)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:outline-none focus:border-primary-500"
                    />
                    <span className="text-slate-400">To</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        handleTimeChange(day.dayOfWeek, "endTime", e.target.value)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-navy-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Unavailable / Closed</span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="primary" onClick={handleSave} isLoading={saving}>
              Save Availability
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
