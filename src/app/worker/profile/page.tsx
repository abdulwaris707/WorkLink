"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Plus,
  X,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input, Textarea } from "@/ui/Input";
import { Badge } from "@/ui/Badge";
import { useToast } from "@/ui/Toast";

export default function WorkerProfilePage() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("Home Services");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [hourlyRate, setHourlyRate] = useState("50");
  const [startingPrice, setStartingPrice] = useState("50");
  const [experienceYears, setExperienceYears] = useState("3");
  const [serviceArea, setServiceArea] = useState("");
  const [responseTime, setResponseTime] = useState("Under 1 hour");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setName(data.profile.name || "");
          setAvatarUrl(data.profile.avatarUrl || "");
          const wp = data.profile.workerProfile;
          if (wp) {
            setBio(wp.bio || "");
            setCategory(wp.category || "Home Services");
            setSkills(wp.skills || []);
            setHourlyRate(wp.hourlyRate?.toString() || "50");
            setStartingPrice(wp.startingPrice?.toString() || "50");
            setExperienceYears(wp.experienceYears?.toString() || "3");
            setServiceArea(wp.serviceArea || "");
            setResponseTime(wp.responseTime || "Under 1 hour");
            setPortfolioImages(wp.portfolioImages || []);
            setSlug(wp.slug || "");
          }
        }
      })
      .catch(() => {});
  }, []);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const addPortfolio = () => {
    if (newPortfolioUrl.trim()) {
      setPortfolioImages([...portfolioImages, newPortfolioUrl.trim()]);
      setNewPortfolioUrl("");
    }
  };

  const removePortfolio = (urlToRemove: string) => {
    setPortfolioImages(portfolioImages.filter((p) => p !== urlToRemove));
  };

  // Completeness score
  const completenessFields = [name, bio, category, skills.length > 0, hourlyRate, serviceArea, avatarUrl];
  const completeness = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          category,
          skills,
          hourlyRate,
          startingPrice,
          experienceYears,
          serviceArea,
          responseTime,
          avatarUrl,
          portfolioImages,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      toast.success("Profile Updated", "Your public marketplace profile has been refreshed.");
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="WORKER">
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Public Profile Editor</h1>
            <p className="text-xs text-slate-500 mt-1">
              Customize your bio, skill badges, pricing, and portfolio showcase.
            </p>
          </div>
          {slug && (
            <Link href={`/workers/${slug}`} target="_blank">
              <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Preview Live Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Profile Completeness Bar */}
        <Card className="p-4 bg-slate-50 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary-600" /> Profile Completeness: {completeness}%
            </span>
            <p className="text-[11px] text-slate-500">
              Profiles with photos, bio, and clear skills get booked 3x more often.
            </p>
          </div>
          <div className="w-full sm:w-48 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-sm font-bold text-navy-900 pb-3 border-b border-slate-100">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                  Primary Category
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
            </div>

            <Textarea
              label="Professional Bio"
              placeholder="Introduce your background, certifications, experience, and why clients should choose you..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Starting Price (USD)"
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                required
              />

              <Input
                label="Hourly Rate (USD)"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                required
              />

              <Input
                label="Years Experience"
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Service Area (Neighborhoods / Cities)"
                placeholder="e.g. Greater Seattle & Bellevue"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                required
              />

              <Input
                label="Typical Response Time"
                placeholder="e.g. Under 30 mins"
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
                required
              />
            </div>

            <Input
              label="Profile Photo URL"
              placeholder="https://images.unsplash.com/photo-..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              helperText="High quality professional headshot URL"
            />

            {/* Skills Badges Input */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                Skills & Specialties
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Panel Upgrades"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-navy-900 focus:outline-none focus:border-primary-500"
                />
                <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-navy-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio Images URLs */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1.5">
                Portfolio Images
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newPortfolioUrl}
                  onChange={(e) => setNewPortfolioUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-navy-900 focus:outline-none focus:border-primary-500"
                />
                <Button type="button" variant="outline" size="sm" onClick={addPortfolio}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Photo
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {portfolioImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group"
                  >
                    <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePortfolio(img)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" isLoading={saving}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
