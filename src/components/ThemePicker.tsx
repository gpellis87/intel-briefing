"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, themes } from "@/context/ThemeContext";
import { Palette, Check } from "lucide-react";

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
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
        aria-label="Change theme"
      >
        <Palette size={13} />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-surface-secondary border border-border-primary rounded-xl shadow-xl overflow-hidden animate-slide-down z-50">
          <div className="p-1.5">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setTheme(t.name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-surface-hover"
              >
                <span
                  className="w-5 h-5 rounded-full border-2 border-border-secondary flex-shrink-0"
                  style={{ backgroundColor: t.preview }}
                />
                <span className="text-text-primary font-medium">{t.label}</span>
                {theme === t.name && (
                  <Check size={14} className="ml-auto text-accent-cyan" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
