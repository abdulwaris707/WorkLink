import React from "react";
import Link from "next/link";
import { ShieldCheck, Star, MapPin, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Avatar, RatingStars } from "@/ui/Feedback";
import { formatCurrency } from "@/lib/utils";

export interface WorkerCardProps {
  worker: {
    id: string;
    slug: string;
    bio?: string | null;
    category: string;
    skills: string[];
    startingPrice: number;
    hourlyRate: number;
    experienceYears: number;
    serviceArea: string;
    responseTime: string;
    isAvailable: boolean;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    portfolioImages?: string[];
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
      location?: string | null;
    };
    services?: Array<{
      id: string;
      title: string;
      price: number;
    }>;
  };
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker }) => {
  return (
    <Card hoverEffect className="flex flex-col h-full overflow-hidden border-slate-200/90">
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row: Avatar, Name, Verified, Category */}
          <div className="flex items-start gap-3.5">
            <Avatar
              name={worker.user.name}
              src={worker.user.avatarUrl}
              size="lg"
              className="rounded-2xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-bold text-navy-900 truncate">
                  {worker.user.name}
                </h3>
                {worker.isVerified && (
                  <span
                    title="WorkLink Verified Pro"
                    className="inline-flex items-center text-primary-600 shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4 fill-primary-50" />
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-primary-700 mt-0.5">
                {worker.category}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-navy-900">{worker.rating.toFixed(1)}</span>
                  <span>({worker.reviewCount})</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {worker.serviceArea || worker.user.location || "Metro Area"}
                </span>
              </div>
            </div>
          </div>

          {/* Bio Snippet */}
          {worker.bio && (
            <p className="mt-3.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {worker.bio}
            </p>
          )}

          {/* Skill Badges */}
          {worker.skills && worker.skills.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {worker.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-navy-700 rounded-md"
                >
                  {skill}
                </span>
              ))}
              {worker.skills.length > 3 && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
                  +{worker.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer info & CTA */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
              Starting from
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-navy-900">
                {formatCurrency(worker.startingPrice)}
              </span>
              <span className="text-xs text-slate-500">/ job</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {worker.isAvailable ? (
              <Badge variant="success" size="sm" className="hidden sm:inline-flex">
                Available
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="hidden sm:inline-flex">
                Busy
              </Badge>
            )}
            <Link href={`/workers/${worker.slug}`}>
              <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
