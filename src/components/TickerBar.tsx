"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { Radio } from "lucide-react";

interface TickerBarProps {
  articles: EnrichedArticle[];
}

export function TickerBar({ articles }: TickerBarProps) {
  const headlines = articles.slice(0, 15);
  if (headlines.length === 0) return null;

  return (
    <div className="relative w-full bg-surface-secondary/80 backdrop-blur-sm border-b border-border-primary overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-600/90 z-10">
          <Radio size={12} className="animate-pulse-slow" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            Live
          </span>
        </div>

        <div className="overflow-hidden flex-1">
          <div className="ticker-scroll flex items-center gap-10 whitespace-nowrap py-2.5 px-6">
            {[...headlines, ...headlines].map((article, i) => (
              <a
                key={`${article.id}-${i}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-sm text-text-secondary hover:text-accent-cyan transition-colors"
              >
                <span className="text-border-secondary">|</span>
                <span className="text-[10px] text-text-muted uppercase font-semibold">
                  {article.source.name}
                </span>
                {article.bias && <BiasBadge bias={article.bias} size="sm" />}
                <span className="max-w-[350px] truncate">
                  {article.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
