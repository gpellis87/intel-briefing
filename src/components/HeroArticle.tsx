"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { getBiasBorderColor, getBiasGlow, timeAgo } from "@/lib/utils";
import { ExternalLink, Clock, Flame } from "lucide-react";

interface HeroArticleProps {
  article: EnrichedArticle;
}

export function HeroArticle({ article }: HeroArticleProps) {
  const borderColor = getBiasBorderColor(article.bias);
  const glow = getBiasGlow(article.bias);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block bg-navy-900/80 backdrop-blur-sm rounded-2xl border ${borderColor} ${glow} hover:border-opacity-70 transition-all duration-300 overflow-hidden`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Image side */}
        {article.urlToImage && (
          <div className="relative h-64 lg:h-full min-h-[280px] overflow-hidden">
            <img
              src={article.urlToImage}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-navy-900/80 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/30 to-transparent lg:hidden" />
          </div>
        )}

        {/* Content side */}
        <div className="flex flex-col justify-center p-6 lg:p-8 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25">
              <Flame size={11} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                Top Story
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock size={11} />
              <span className="text-xs">{timeAgo(article.publishedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-300">
              {article.source.name}
            </span>
            {article.bias && <BiasBadge bias={article.bias} size="md" />}
          </div>

          {article.reliability !== null && (
            <ReliabilityMeter
              score={article.reliability}
              showLabel
              size="md"
            />
          )}

          <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-gray-50 leading-snug group-hover:text-accent-cyan transition-colors">
            {article.title}
          </h2>

          {article.description && (
            <p className="text-base text-gray-400 leading-relaxed line-clamp-3">
              {article.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-sm text-gray-500 group-hover:text-accent-cyan transition-colors mt-1">
            <ExternalLink size={13} />
            <span>Read full article on {article.sourceDomain}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
