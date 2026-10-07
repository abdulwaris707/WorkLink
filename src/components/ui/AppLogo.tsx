import React from "react";
import Image from "next/image";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  textClassName = "",
}) => {
  const dimensions = {
    sm: { box: "w-8 h-8", px: 32, text: "text-lg" },
    md: { box: "w-9 h-9", px: 36, text: "text-xl" },
    lg: { box: "w-11 h-11", px: 44, text: "text-2xl" },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${dimensions.box} rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-white shrink-0 border border-slate-100/80 p-0.5`}
      >
        <Image
          src="/logo.png"
          alt="WorkLink"
          width={dimensions.px}
          height={dimensions.px}
          priority
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <span
          className={`font-bold tracking-tight text-navy-900 ${dimensions.text} ${textClassName}`}
        >
          Work<span className="text-primary-600">Link</span>
        </span>
      )}
    </div>
  );
};
