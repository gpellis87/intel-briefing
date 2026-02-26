"use client";

import type { BiasRating } from "@/types";
import { getBiasColor, getBiasLabel } from "@/lib/utils";

interface BiasBadgeProps {
  bias: BiasRating;
  size?: "sm" | "md" | "lg";
}

export function BiasBadge({ bias, size = "sm" }: BiasBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide uppercase ${getBiasColor(bias)} ${sizeClasses[size]}`}
    >
      {getBiasLabel(bias)}
    </span>
  );
}
