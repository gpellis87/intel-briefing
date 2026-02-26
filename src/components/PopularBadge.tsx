"use client";

import { Flame } from "lucide-react";

interface PopularBadgeProps {
  clicks: number;
}

export function PopularBadge({ clicks }: PopularBadgeProps) {
  if (clicks < 1) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/12 text-orange-400 border border-orange-500/20">
      <Flame size={8} />
      Popular
    </span>
  );
}
