"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { NewsBadge } from "./NewsBadge";
import { ShareButton } from "./ShareButton";
import { getBiasBorderColor, timeAgo, getRecencyBadge } from "@/lib/utils";
import { ExternalLink, Clock, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface ArticleCardProps {
  article: EnrichedArticle;
  compact?: boolean;
  isRead?: boolean;
  onMarkRead?: (id: string) => void;
  isFocused?: boolean;
  index?: number;
}

export function ArticleCard({
  article,
  compact = false,
  isRead = false,
  onMarkRead,
  isFocused = false,
  index,
}: ArticleCardProps) {
  const borderColor = getBiasBorderColor(article.bias);
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(article.id);
  const recency = getRecencyBadge(article.publishedAt);

  const handleClick = () => {
    onMarkRead?.(article.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(article);
  };

  return (
    <article
      data-article-index={index}
      className={`group relative flex flex-col bg-surface-secondary rounded-2xl border ${borderColor} hover:border-border-secondary hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isFocused ? "keyboard-focus" : ""
      } ${isRead ? "article-read" : ""}`}
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
            onClick={handleSave}
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-[11px] font-semibold transition-all ${
              saved
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                : "bg-black/40 text-white/80 border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-black/60"
            }`}
          >
            {saved ? (
              <>
                <BookmarkCheck size={13} fill="currentColor" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <BookmarkPlus size={13} />
                <span>Save</span>
              </>
            )}
          </button>

          {recency && (
            <div className="absolute top-3 left-3">
              <NewsBadge badge={recency} />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
              {article.source.name}
            </span>
            {article.bias && <BiasBadge bias={article.bias} />}
            {!article.urlToImage && recency && <NewsBadge badge={recency} />}
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
          onClick={handleClick}
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
            onClick={handleClick}
          >
            <ExternalLink size={11} />
            <span>{article.sourceDomain}</span>
          </a>
          <div className="flex items-center gap-1">
            <ShareButton
              url={article.url}
              title={article.title}
              source={article.source.name}
              size="sm"
            />
            {!article.urlToImage && (
              <button
                onClick={handleSave}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  saved
                    ? "text-accent-cyan bg-accent-cyan/10"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-tertiary opacity-0 group-hover:opacity-100"
                }`}
              >
                {saved ? (
                  <BookmarkCheck size={12} fill="currentColor" />
                ) : (
                  <BookmarkPlus size={12} />
                )}
                <span>{saved ? "Saved" : "Save"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
