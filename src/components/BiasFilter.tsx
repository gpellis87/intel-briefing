"use client";

import type { BiasDirection } from "@/types";

type FilterOption = "all" | BiasDirection;

interface BiasFilterProps {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
}

const options: { value: FilterOption; label: string; dot?: string }[] = [
  { value: "all", label: "All" },
  { value: "left", label: "Left", dot: "bg-blue-500" },
  { value: "center", label: "Center", dot: "bg-gray-400" },
  { value: "right", label: "Right", dot: "bg-red-500" },
];

export function BiasFilter({ value, onChange }: BiasFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-0.5 border border-border-primary">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-surface-elevated text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {opt.dot && (
            <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
