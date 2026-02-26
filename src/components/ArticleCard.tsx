"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { getBiasBorderColor, getBiasGlow, timeAgo } from "@/lib/utils";
import { ExternalLink, Clock } from "lucide-react";

interface ArticleCardProps {
  article: EnrichedArticle;
  compact?: boolean;
}

export function ArticleCard({
  article,
  compact = false,
}: ArticleCardProps) {
  const borderColor = getBiasBorderColor(article.bias);
  const glow = getBiasGlow(article.bias);

  return (
    <article
      className={`group relative flex flex-col bg-navy-900/80 backdrop-blur-sm rounded-xl border ${borderColor} ${glow} hover:border-opacity-60 transition-all duration-300 overflow-hidden`}
    >
      {article.urlToImage && !compact && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/20 to-transparent" />
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {article.source.name}
            </span>
            {article.bias && <BiasBadge bias={article.bias} />}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={10} />
            <span className="text-[10px]">{timeAgo(article.publishedAt)}</span>
          </div>
        </div>

        {article.reliability !== null && (
          <ReliabilityMeter score={article.reliability} showLabel />
        )}

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link"
        >
          <h3
            className={`font-semibold leading-snug text-gray-100 group-hover/link:text-accent-cyan transition-colors ${
              compact ? "text-sm line-clamp-2" : "text-[15px] line-clamp-3"
            }`}
          >
            {article.title}
          </h3>
        </a>

        {article.description && !compact && (
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-accent-cyan transition-colors"
          >
            <ExternalLink size={11} />
            <span>{article.sourceDomain}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
