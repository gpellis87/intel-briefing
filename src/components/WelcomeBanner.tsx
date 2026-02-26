"use client";

import { useState, useEffect } from "react";
import { X, Shield, Bookmark, Filter, Newspaper, Radar } from "lucide-react";

const STORAGE_KEY = "intel-welcome-dismissed";

const features = [
  { icon: Shield, text: "Bias & reliability ratings on every source" },
  { icon: Bookmark, text: "Save articles for later -- they persist forever" },
  { icon: Filter, text: "Filter by source, bias, and time range" },
  { icon: Newspaper, text: "Daily Briefing summarizes all categories" },
  { icon: Radar, text: "Set keyword alerts for topics you care about" },
];

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div className="relative bg-surface-secondary border border-border-primary rounded-2xl p-5 animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
      >
        <X size={14} />
      </button>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary">
            Welcome to Intel Briefing
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Multi-perspective news with built-in bias analysis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.text}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-tertiary/60"
              >
                <Icon size={12} className="text-accent-cyan flex-shrink-0" />
                <span className="text-[11px] text-text-secondary">{f.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
