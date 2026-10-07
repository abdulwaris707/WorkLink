import React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} {...props} />;
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center justify-center text-primary-600 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = "md", className }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl font-bold",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "WL";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover border border-slate-200 shrink-0",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-100 text-primary-800 border border-primary-200 font-semibold flex items-center justify-center shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
};

export interface RatingStarsProps {
  rating: number;
  total?: number;
  showText?: boolean;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: "sm" | "md";
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  total = 5,
  showText = false,
  interactive = false,
  onChange,
  size = "md",
}) => {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < Math.floor(rating);
          return (
            <button
              key={i}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(i + 1)}
              className={cn(
                "transition-colors",
                interactive && "cursor-pointer hover:scale-110",
                !interactive && "cursor-default pointer-events-none"
              )}
            >
              <Star
                className={cn(
                  iconSize,
                  filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-300"
                )}
              />
            </button>
          );
        })}
      </div>
      {showText && (
        <span className="text-xs font-semibold text-navy-800">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
