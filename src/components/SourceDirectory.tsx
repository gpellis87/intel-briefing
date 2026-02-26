"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Search, Shield, Filter } from "lucide-react";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { getAllSources } from "@/lib/bias-lookup";
import type { SourceBiasData } from "@/types";

const STORAGE_KEY = "intel-excluded-sources";

export function useSourceFilter() {
  const [excluded, setExcludedState] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setExcludedState(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const setExcluded = useCallback((next: Set<string>) => {
    setExcludedState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const toggleSource = useCallback((domain: string) => {
    setExcludedState((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isExcluded = useCallback((domain: string) => excluded.has(domain), [excluded]);

  const clearAll = useCallback(() => {
    setExcludedState(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { excluded, setExcluded, toggleSource, isExcluded, clearAll, excludedCount: excluded.size, mounted };
}

interface SourceDirectoryProps {
  open: boolean;
  onClose: () => void;
  excluded: Set<string>;
  onToggleSource: (domain: string) => void;
  onClearAll: () => void;
  onQuickFilter: (domains: Set<string>) => void;
}

type SortKey = "name" | "bias" | "reliability";

export function SourceDirectory({
  open, onClose, excluded, onToggleSource, onClearAll, onQuickFilter,
}: SourceDirectoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("reliability");

  const allSources = useMemo(() => getAllSources(), []);

  const biasOrder: Record<string, number> = {
    "far-left": 0, left: 1, "center-left": 2, center: 3,
    "center-right": 4, right: 5, "far-right": 6,
  };

  const filtered = useMemo(() => {
    let sources = allSources;
    if (search.trim()) {
      const q = search.toLowerCase();
      sources = sources.filter(
        (s) => s.name.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q)
      );
    }
    return [...sources].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "bias") return (biasOrder[a.bias] || 3) - (biasOrder[b.bias] || 3);
      return b.reliability - a.reliability;
    });
  }, [allSources, search, sortBy, biasOrder]);

  const quickFilterHighReliability = () => {
    const lowReliability = new Set(
      allSources.filter((s) => s.reliability < 75).map((s) => s.domain)
    );
    onQuickFilter(lowReliability);
  };

  const quickFilterCenterOnly = () => {
    const nonCenter = new Set(
      allSources
        .filter((s) => !["center", "center-left", "center-right"].includes(s.bias))
        .map((s) => s.domain)
    );
    onQuickFilter(nonCenter);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className="relative w-full max-w-md bg-surface-secondary border-l border-border-primary shadow-2xl overflow-hidden flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-accent-cyan" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-[var(--font-family-mono)]">
              Sources ({allSources.length})
            </h3>
            {excluded.size > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">
                {excluded.size} hidden
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search + Sort + Quick Filters */}
        <div className="px-6 py-3 space-y-3 border-b border-border-primary">
          <div className="flex items-center gap-2 bg-surface-tertiary rounded-lg px-3 py-2">
            <Search size={14} className="text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter sources..."
              className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-surface-tertiary rounded-lg p-0.5">
              {(["reliability", "name", "bias"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    sortBy === key
                      ? "bg-surface-elevated text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={quickFilterHighReliability}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <Shield size={10} className="inline mr-1" />
              High Reliability
            </button>
            <button
              onClick={quickFilterCenterOnly}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 bg-gray-500/10 border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
            >
              Center Only
            </button>
            {excluded.size > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* Source list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((source: SourceBiasData) => {
            const hidden = excluded.has(source.domain);
            return (
              <button
                key={source.domain}
                onClick={() => onToggleSource(source.domain)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-surface-hover transition-colors border-b border-border-primary/50 ${
                  hidden ? "opacity-40" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={!hidden}
                  readOnly
                  className="w-4 h-4 rounded border-border-secondary accent-accent-cyan flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {source.name}
                  </div>
                  <div className="text-[11px] text-text-muted">{source.domain}</div>
                </div>
                <BiasBadge bias={source.bias} />
                <ReliabilityMeter score={source.reliability} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
