"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List, Rows3 } from "lucide-react";

export type ViewMode = "grid" | "list" | "compact";

const STORAGE_KEY = "intel-view-mode";

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>("grid");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (stored && ["grid", "list", "compact"].includes(stored)) {
      setViewModeState(stored);
    }
    setMounted(true);
  }, []);

  const setViewMode = (m: ViewMode) => {
    setViewModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  return { viewMode, setViewMode, mounted };
}

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const options: { value: ViewMode; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { value: "grid", icon: LayoutGrid, label: "Grid" },
  { value: "list", icon: List, label: "List" },
  { value: "compact", icon: Rows3, label: "Compact" },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-surface-secondary rounded-lg p-0.5 border border-border-primary">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`p-1.5 rounded-md transition-all ${
              value === opt.value
                ? "bg-surface-elevated text-accent-cyan shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
            title={opt.label}
            aria-label={`${opt.label} view`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
