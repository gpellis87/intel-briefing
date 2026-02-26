"use client";

import { useState, useRef, useEffect } from "react";
import { ALargeSmall, Check } from "lucide-react";

export type DensityMode = "compact" | "comfortable" | "spacious";

const STORAGE_KEY = "intel-density";

const modes: { value: DensityMode; label: string; desc: string }[] = [
  { value: "compact", label: "Compact", desc: "Smaller text, tight spacing" },
  { value: "comfortable", label: "Comfortable", desc: "Default balanced view" },
  { value: "spacious", label: "Spacious", desc: "Larger text, more padding" },
];

export function useDensity() {
  const [density, setDensityState] = useState<DensityMode>("comfortable");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DensityMode | null;
    if (stored && modes.some((m) => m.value === stored)) {
      setDensityState(stored);
    }
    setMounted(true);
  }, []);

  const setDensity = (d: DensityMode) => {
    setDensityState(d);
    localStorage.setItem(STORAGE_KEY, d);
    document.documentElement.setAttribute("data-density", d);
  };

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-density", density);
    }
  }, [density, mounted]);

  return { density, setDensity };
}

export function DensityPicker() {
  const { density, setDensity } = useDensity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
        aria-label="Text density"
        title="Text size & density"
      >
        <ALargeSmall size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-surface-secondary border border-border-primary rounded-xl shadow-xl overflow-hidden animate-slide-down z-50">
          <div className="p-1.5">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setDensity(m.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-surface-hover"
              >
                <div className="text-left">
                  <div className="text-text-primary font-medium">{m.label}</div>
                  <div className="text-[11px] text-text-muted">{m.desc}</div>
                </div>
                {density === m.value && (
                  <Check size={14} className="ml-2 text-accent-cyan flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
