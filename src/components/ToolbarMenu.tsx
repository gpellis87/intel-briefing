"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal, History, Eye, EyeOff, CheckCheck,
  Filter, Radar, Newspaper, Keyboard, X,
} from "lucide-react";
import { DensityPicker } from "./DensityPicker";

interface ToolbarMenuProps {
  hideRead: boolean;
  onToggleHideRead: () => void;
  onMarkAllRead: () => void;
  onShowSources: () => void;
  excludedCount: number;
  onShowAlerts: () => void;
  alertCount: number;
  onShowDigest: () => void;
  onShowHistory: () => void;
  onShowShortcuts: () => void;
}

export function ToolbarMenu({
  hideRead,
  onToggleHideRead,
  onMarkAllRead,
  onShowSources,
  excludedCount,
  onShowAlerts,
  alertCount,
  onShowDigest,
  onShowHistory,
  onShowShortcuts,
}: ToolbarMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const MenuItem = ({
    icon: Icon,
    label,
    badge,
    active,
    onClick,
  }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    badge?: string | number;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={() => {
        onClick();
        setOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-surface-hover ${
        active ? "text-accent-cyan" : "text-text-primary"
      }`}
    >
      <Icon size={15} className={active ? "text-accent-cyan" : "text-text-muted"} />
      <span className="font-medium">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan tabular-nums">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
        aria-label="More options"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden animate-slide-down z-50">
          <div className="p-1.5 space-y-0.5">
            <MenuItem
              icon={History}
              label="Reading History"
              onClick={onShowHistory}
            />
            <MenuItem
              icon={hideRead ? EyeOff : Eye}
              label={hideRead ? "Show Read" : "Hide Read"}
              active={hideRead}
              onClick={onToggleHideRead}
            />
            <MenuItem
              icon={CheckCheck}
              label="Mark All Read"
              onClick={onMarkAllRead}
            />

            <div className="border-t border-border-primary my-1" />

            <MenuItem
              icon={Filter}
              label="Source Filter"
              badge={excludedCount > 0 ? excludedCount : undefined}
              active={excludedCount > 0}
              onClick={onShowSources}
            />
            <MenuItem
              icon={Radar}
              label="Keyword Alerts"
              badge={alertCount > 0 ? alertCount : undefined}
              active={alertCount > 0}
              onClick={onShowAlerts}
            />

            <div className="border-t border-border-primary my-1" />

            <MenuItem
              icon={Newspaper}
              label="Daily Briefing"
              onClick={onShowDigest}
            />

            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Density</span>
                <DensityPicker />
              </div>
            </div>

            <div className="border-t border-border-primary my-1" />

            <MenuItem
              icon={Keyboard}
              label="Keyboard Shortcuts"
              onClick={onShowShortcuts}
            />
          </div>
        </div>
      )}
    </div>
  );
}
