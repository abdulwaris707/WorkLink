import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-primary-50 text-primary-700 border-primary-200 font-semibold",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-brandBlue-50 text-blue-700 border-blue-200",
    outline: "bg-white text-navy-800 border-slate-200",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
