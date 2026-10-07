"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useToast } from "@/ui/Toast";
import { ReportModal } from "@/components/dashboard/ReportModal";

export default function ClientSettingsPage() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [refreshReports, setRefreshReports] = useState(0);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setName(data.profile.name || "");
          setEmail(data.profile.email || "");
          setPhone(data.profile.phone || "");
          setLocation(data.profile.location || "");
          setAvatarUrl(data.profile.avatarUrl || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, location, avatarUrl }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile Updated", "Your changes have been saved successfully.");
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="CLIENT">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Account Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile and contact preferences.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-sm font-bold text-navy-900 pb-3 border-b border-slate-100">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />

              <Input
                label="Location / Primary Area"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Downtown Seattle, WA"
              />
            </div>

            <Input
              label="Avatar Image URL (Optional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              helperText="Paste an image link or leave blank to display your initials."
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" isLoading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Support & Dispute Reports Section */}
        <ReportsHistorySection onOpenReportModal={() => setShowReportModal(true)} />

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => setRefreshReports((prev) => prev + 1)}
        />
      </div>
    </DashboardLayout>
  );
}

function ReportsHistorySection({ onOpenReportModal }: { onOpenReportModal: () => void }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) setReports(data.reports);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="p-6 sm:p-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Support & Dispute Reports</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            File incident reports or track progress on open investigations.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenReportModal}>
          Report an Issue
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-2">Loading report history...</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-slate-500">No open or past dispute reports.</p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy-900">{r.reason}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "INVESTIGATING"
                        ? "bg-blue-100 text-blue-800"
                        : r.status === "DISMISSED"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 line-clamp-2">{r.details}</p>
                {r.resolutionNotes && (
                  <p className="text-emerald-700 font-medium mt-1">
                    Moderator Note: {r.resolutionNotes}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
