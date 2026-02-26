"use client";

import type { EnrichedArticle } from "@/types";
import { Activity, Shield, BarChart3 } from "lucide-react";

interface StatsBarProps {
  articles: EnrichedArticle[];
  total: number;
}

export function StatsBar({ articles, total }: StatsBarProps) {
  const leftCount = articles.filter((a) => a.biasDirection === "left").length;
  const centerCount = articles.filter((a) => a.biasDirection === "center").length;
  const rightCount = articles.filter((a) => a.biasDirection === "right").length;
  const unknownCount = articles.filter((a) => a.biasDirection === null).length;
  const totalBias = leftCount + centerCount + rightCount + unknownCount;

  const avgReliability =
    articles.filter((a) => a.reliability !== null).length > 0
      ? Math.round(
          articles
            .filter((a) => a.reliability !== null)
            .reduce((sum, a) => sum + (a.reliability || 0), 0) /
            articles.filter((a) => a.reliability !== null).length
        )
      : 0;

  const biasSegments = [
    { count: leftCount, color: "bg-blue-500", label: "Left" },
    { count: centerCount, color: "bg-gray-400", label: "Center" },
    { count: rightCount, color: "bg-red-500", label: "Right" },
    { count: unknownCount, color: "bg-surface-elevated", label: "Unrated" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 px-1 text-xs animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Activity size={13} className="text-accent-cyan" />
          <span className="font-semibold text-text-primary">{total}</span>
          <span>Sources</span>
        </div>

        <div className="w-px h-4 bg-border-primary hidden sm:block" />

        <div className="flex items-center gap-1.5 text-text-secondary">
          <Shield size={13} className="text-emerald-500" />
          <span>Reliability:</span>
          <span className="font-semibold text-text-primary">{avgReliability}</span>
        </div>
      </div>

      <div className="w-px h-4 bg-border-primary hidden sm:block" />

      {/* Bias spectrum bar */}
      <div className="flex items-center gap-3">
        <BarChart3 size={13} className="text-text-muted flex-shrink-0" />
        <div className="flex items-center gap-1.5 h-2 w-32 sm:w-48 rounded-full overflow-hidden bg-surface-tertiary">
          {biasSegments
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.label}
                className={`h-full ${s.color} transition-all duration-500`}
                style={{ width: `${(s.count / totalBias) * 100}%` }}
                title={`${s.label}: ${s.count}`}
              />
            ))}
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          {biasSegments
            .filter((s) => s.count > 0)
            .map((s) => (
              <div key={s.label} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                <span>{s.count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
