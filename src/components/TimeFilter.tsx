"use client";

import { Clock } from "lucide-react";

export type TimeRange = "all" | "1h" | "today" | "24h" | "48h";

const options: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "1h", label: "1h" },
  { value: "today", label: "Today" },
  { value: "24h", label: "24h" },
  { value: "48h", label: "48h" },
];

interface TimeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function getTimeFilterMs(range: TimeRange): number | null {
  switch (range) {
    case "1h": return 60 * 60 * 1000;
    case "today": return null;
    case "24h": return 24 * 60 * 60 * 1000;
    case "48h": return 48 * 60 * 60 * 1000;
    default: return null;
  }
}

export function passesTimeFilter(publishedAt: string, range: TimeRange): boolean {
  if (range === "all") return true;
  const pubTime = new Date(publishedAt).getTime();
  if (isNaN(pubTime)) return false;

  if (range === "today") {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return pubTime >= startOfDay;
  }

  const maxAge = getTimeFilterMs(range);
  if (!maxAge) return true;
  return Date.now() - pubTime <= maxAge;
}

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-0.5 border border-border-primary">
      <Clock size={12} className="text-text-muted ml-2 mr-1" />
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-surface-elevated text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
