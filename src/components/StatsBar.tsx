"use client";

import type { EnrichedArticle } from "@/types";
import { Activity, Shield } from "lucide-react";

interface StatsBarProps {
  articles: EnrichedArticle[];
  total: number;
}

export function StatsBar({ articles, total }: StatsBarProps) {
  const leftCount = articles.filter((a) => a.biasDirection === "left").length;
  const centerCount = articles.filter(
    (a) => a.biasDirection === "center"
  ).length;
  const rightCount = articles.filter((a) => a.biasDirection === "right").length;
  const unknownCount = articles.filter((a) => a.biasDirection === null).length;

  const avgReliability =
    articles.filter((a) => a.reliability !== null).length > 0
      ? Math.round(
          articles
            .filter((a) => a.reliability !== null)
            .reduce((sum, a) => sum + (a.reliability || 0), 0) /
            articles.filter((a) => a.reliability !== null).length
        )
      : 0;

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-2 px-1 text-xs">
      <div className="flex items-center gap-1.5 text-gray-400">
        <Activity size={12} className="text-accent-cyan" />
        <span className="font-semibold text-gray-300">{total}</span>
        <span>Sources</span>
      </div>

      <div className="w-px h-4 bg-navy-700" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-400">{leftCount} Left</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400">{centerCount} Center</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-400">{rightCount} Right</span>
        </div>
        {unknownCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-navy-600" />
            <span className="text-gray-500">{unknownCount} Unrated</span>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-navy-700" />

      <div className="flex items-center gap-1.5 text-gray-400">
        <Shield size={12} className="text-emerald-500" />
        <span>Avg Reliability:</span>
        <span className="font-semibold text-gray-300">{avgReliability}</span>
      </div>
    </div>
  );
}
