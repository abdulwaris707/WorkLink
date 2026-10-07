"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Lock,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Input";
import { Avatar, Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Suspend / Reactivate Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/jo/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    const willSuspend = !selectedUser.isSuspended;

    try {
      const res = await fetch("/api/jo/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          isSuspended: willSuspend,
          reason: suspensionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      toast.success(
        "Account Updated",
        `${selectedUser.name} has been ${willSuspend ? "suspended" : "reactivated"}.`
      );
      setSelectedUser(null);
      setSuspensionReason("");
      fetchUsers();
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">User Account Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect platform participants, review role records, and enforce account suspensions.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="CLIENT">Clients</option>
              <option value="WORKER">Workers</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : users.length === 0 ? (
          <Card className="p-10 text-center">
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-300" />}
              title="No Users Found"
              description="No user records matched your search query."
            />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => (
              <Card
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} src={u.avatarUrl} size="md" className="rounded-xl shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">{u.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "WORKER"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.isSuspended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                    <p className="text-[11px] text-slate-400">
                      Joined {formatDate(u.createdAt)} {u.location ? `• ${u.location}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant={u.isSuspended ? "outline" : "ghost"}
                    className={u.isSuspended ? "text-emerald-700" : "text-rose-600 hover:bg-rose-50"}
                    onClick={() => {
                      setSelectedUser(u);
                      setSuspensionReason("");
                    }}
                  >
                    {u.isSuspended ? "Reactivate Account" : "Suspend Account"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Suspend / Reactivate Confirmation Modal */}
        {selectedUser && (
          <Modal
            isOpen={Boolean(selectedUser)}
            onClose={() => setSelectedUser(null)}
            title={selectedUser.isSuspended ? "Reactivate User Account" : "Suspend User Account"}
            description={`Target: ${selectedUser.name} (${selectedUser.email})`}
            maxWidth="sm"
          >
            <form onSubmit={handleToggleSuspend} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Administrative Reason <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  placeholder={
                    selectedUser.isSuspended
                      ? "e.g. Identity clarified, dispute resolved..."
                      : "e.g. Terms violation, fraudulent activity, spam..."
                  }
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={selectedUser.isSuspended ? "primary" : "destructive"}
                  size="sm"
                  isLoading={submitting}
                >
                  {selectedUser.isSuspended ? "Confirm Reactivation" : "Confirm Suspension"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
