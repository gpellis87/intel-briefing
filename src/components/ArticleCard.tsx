"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { getBiasBorderColor, timeAgo } from "@/lib/utils";
import { ExternalLink, Clock, Bookmark } from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface ArticleCardProps {
  article: EnrichedArticle;
  compact?: boolean;
}

export function ArticleCard({ article, compact = false }: ArticleCardProps) {
  const borderColor = getBiasBorderColor(article.bias);
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(article.id);

  return (
    <article
      className={`group relative flex flex-col bg-surface-secondary rounded-2xl border ${borderColor} hover:border-border-secondary hover:shadow-lg transition-all duration-300 overflow-hidden`}
    >
      {article.urlToImage && !compact && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-transparent to-transparent" />

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleBookmark(article.id);
            }}
            className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-all ${
              saved
                ? "bg-accent-cyan/20 text-accent-cyan"
                : "bg-black/30 text-white/60 opacity-0 group-hover:opacity-100 hover:text-white"
            }`}
            aria-label={saved ? "Remove bookmark" : "Bookmark article"}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
              {article.source.name}
            </span>
            {article.bias && <BiasBadge bias={article.bias} />}
          </div>
          <div className="flex items-center gap-1 text-text-muted flex-shrink-0">
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
            className={`font-semibold leading-snug text-text-primary group-hover/link:text-accent-cyan transition-colors ${
              compact ? "text-sm line-clamp-2" : "text-[15px] line-clamp-3"
            }`}
          >
            {article.title}
          </h3>
        </a>

        {article.description && !compact && (
          <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border-primary">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors"
          >
            <ExternalLink size={11} />
            <span>{article.sourceDomain}</span>
          </a>
          {!article.urlToImage && (
            <button
              onClick={() => toggleBookmark(article.id)}
              className={`p-1 rounded transition-colors ${
                saved
                  ? "text-accent-cyan"
                  : "text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-primary"
              }`}
              aria-label={saved ? "Remove bookmark" : "Bookmark article"}
            >
              <Bookmark size={12} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
