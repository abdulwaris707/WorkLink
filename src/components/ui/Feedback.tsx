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

export interface DotLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  text?: string;
  inline?: boolean;
}

/**
 * Animated Dot Rounding Loader (Circular rotating dot cluster)
 * Suitable for inline card text, button badges, card sections, and whole pages.
 */
export const DotLoader: React.FC<DotLoaderProps> = ({
  size = "md",
  color = "text-primary-600",
  text,
  inline = false,
  className,
  ...props
}) => {
  const sizeMap = {
    xs: "w-3.5 h-3.5", // 14px (card text, badges, pill loaders)
    sm: "w-5 h-5",     // 20px (card metrics, subtitles, buttons)
    md: "w-8 h-8",     // 32px (cards, modals)
    lg: "w-12 h-12",   // 48px (large sections)
    xl: "w-16 h-16",   // 64px (full page)
  };

  const svgSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={cn(
        inline ? "inline-flex items-center gap-2" : "flex flex-col items-center justify-center gap-3",
        className
      )}
      {...props}
    >
      <svg
        viewBox="0 0 38 38"
        className={cn("animate-spin shrink-0", svgSize, color)}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading..."
        role="status"
      >
        <circle cx="19" cy="4" r="3.2" opacity="1" />
        <circle cx="29.6" cy="8.4" r="3" opacity="0.875" />
        <circle cx="34" cy="19" r="2.8" opacity="0.75" />
        <circle cx="29.6" cy="29.6" r="2.6" opacity="0.625" />
        <circle cx="19" cy="34" r="2.4" opacity="0.5" />
        <circle cx="8.4" cy="29.6" r="2.2" opacity="0.375" />
        <circle cx="4" cy="19" r="2" opacity="0.25" />
        <circle cx="8.4" cy="8.4" r="1.8" opacity="0.125" />
      </svg>
      {text && (
        <span
          className={cn(
            "text-slate-500 font-semibold tracking-tight",
            size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export interface PageLoaderProps {
  text?: string;
  subtext?: string;
  className?: string;
}

/**
 * Whole page animated dot rounding loader with backdrop card
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  text = "Loading...",
  subtext,
  className,
}) => {
  return (
    <div
      className={cn(
        "min-h-[50vh] w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in",
        className
      )}
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md shadow-card border border-slate-200/80 flex flex-col items-center gap-4 max-w-xs w-full">
        <DotLoader size="lg" color="text-primary-600" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-navy-900">{text}</p>
          {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

export interface CardLoaderProps {
  text?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

/**
 * Centered card / section animated dot rounding loader
 */
export const CardLoader: React.FC<CardLoaderProps> = ({
  text,
  className,
  size = "md",
}) => {
  return (
    <div
      className={cn(
        "w-full py-8 px-4 flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <DotLoader size={size} color="text-primary-600" text={text} />
    </div>
  );
};

export interface CardTextLoaderProps {
  className?: string;
  size?: "xs" | "sm";
  text?: string;
}

/**
 * Subtle inline dot rounding loader for card text, titles, numbers, or tags
 */
export const CardTextLoader: React.FC<CardTextLoaderProps> = ({
  className,
  size = "xs",
  text,
}) => {
  return (
    <span className={cn("inline-flex items-center gap-1.5 align-middle", className)}>
      <DotLoader size={size} inline color="text-primary-600" />
      {text && <span className="text-xs text-slate-400 font-medium">{text}</span>}
    </span>
  );
};
