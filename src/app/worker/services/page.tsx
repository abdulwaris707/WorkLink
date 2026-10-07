"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Modal } from "@/ui/Modal";
import { Input, Textarea } from "@/ui/Input";
import { Skeleton, EmptyState } from "@/ui/Feedback";
import { useToast } from "@/ui/Toast";
import { formatCurrency } from "@/lib/utils";

export default function WorkerServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Home Services");
  const [price, setPrice] = useState("80");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [serviceArea, setServiceArea] = useState("");

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data.services || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setTitle("");
    setDescription("");
    setCategory("Home Services");
    setPrice("75");
    setDurationMinutes("60");
    setServiceArea("");
    setModalOpen(true);
  };

  const openEditModal = (svc: any) => {
    setEditingService(svc);
    setTitle(svc.title);
    setDescription(svc.description);
    setCategory(svc.category);
    setPrice(svc.price.toString());
    setDurationMinutes(svc.durationMinutes.toString());
    setServiceArea(svc.serviceArea || "");
    setModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingService) {
        // PATCH
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            price,
            durationMinutes,
            serviceArea,
          }),
        });
        if (!res.ok) throw new Error("Failed to update service");
        toast.success("Service Updated", "Changes have been published.");
      } else {
        // POST
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            price,
            durationMinutes,
            serviceArea,
          }),
        });
        if (!res.ok) throw new Error("Failed to create service");
        toast.success("Service Created", "New package is now live on your profile.");
      }

      setModalOpen(false);
      fetchServices();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (svc: any) => {
    try {
      await fetch(`/api/services/${svc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !svc.isActive }),
      });
      fetchServices();
    } catch {}
  };

  const handleDeleteService = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`/api/services/${deleteConfirmId}`, {
        method: "DELETE",
      });
      toast.success("Service Deleted", "The service has been permanently removed.");
      setDeleteConfirmId(null);
      fetchServices();
    } catch {
      toast.error("Error", "Could not delete service");
    }
  };

  return (
    <DashboardLayout role="WORKER">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Services & Pricing Menu</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create and price the service packages that clients can book directly.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Service
          </Button>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : services.length === 0 ? (
          <Card className="p-8 text-center">
            <EmptyState
              icon={<Layers className="w-6 h-6 text-slate-400" />}
              title="No Services Created"
              description="Add at least one service package with transparent pricing so clients can book you."
              action={
                <Button size="sm" variant="primary" onClick={openCreateModal}>
                  Create Your First Service
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <Card key={svc.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-navy-900">{svc.title}</h3>
                        {svc.isActive ? (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-primary-600 font-semibold mt-0.5 block">
                        {svc.category}
                      </span>
                    </div>

                    <span className="text-lg font-extrabold text-navy-900">
                      {formatCurrency(svc.price)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                    {svc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{svc.durationMinutes} minutes</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(svc)}
                      title={svc.isActive ? "Deactivate service" : "Activate service"}
                      className="text-xs font-semibold text-slate-500 hover:text-navy-900"
                    >
                      {svc.isActive ? "Turn Off" : "Turn On"}
                    </button>
                    <button
                      onClick={() => openEditModal(svc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                      title="Edit Service"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(svc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Service Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? "Edit Service Package" : "Create New Service Package"}
        description="Provide a clear description and set your pricing for client bookings."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveService} className="space-y-4 pt-1">
          <Input
            label="Service Title"
            placeholder="e.g. Smart Dimmer & Switch Installation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:outline-none focus:border-primary-500"
              >
                <option value="Home Services">Home Services</option>
                <option value="Repairs">Repairs</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Beauty & Wellness">Beauty & Wellness</option>
                <option value="Moving">Moving</option>
                <option value="Tutoring">Tutoring</option>
              </select>
            </div>

            <Input
              label="Price (USD)"
              type="number"
              min="5"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Estimated Duration (Minutes)"
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />

            <Input
              label="Service Area (Optional)"
              placeholder="e.g. Seattle Central"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
            />
          </div>

          <Textarea
            label="Description & What's Included"
            placeholder="Detail what is covered in this service, any equipment provided or client prerequisites..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingService ? "Update Service" : "Publish Service"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          isOpen={Boolean(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Service Package?"
          description="Are you sure you want to remove this service? Existing active bookings will remain untouched."
          maxWidth="sm"
        >
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Keep
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteService}>
              Yes, Delete
            </Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
