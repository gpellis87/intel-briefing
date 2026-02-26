"use client";

import type { RecencyBadge } from "@/lib/utils";
import { Zap } from "lucide-react";

interface NewsBadgeProps {
  badge: RecencyBadge;
}

export function NewsBadge({ badge }: NewsBadgeProps) {
  if (!badge) return null;

  if (badge === "breaking") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25 animate-badge-pulse">
        <Zap size={9} fill="currentColor" />
        Breaking
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
      <Zap size={9} />
      Just In
    </span>
  );
}
