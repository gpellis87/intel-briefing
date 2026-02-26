"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { NewsBadge } from "./NewsBadge";
import { ShareButton } from "./ShareButton";
import { getBiasBorderColor, timeAgo, getRecencyBadge, estimateReadTime } from "@/lib/utils";
import { ExternalLink, Clock, Flame, BookmarkPlus, BookmarkCheck, BookOpen, Pin } from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface HeroArticleProps {
  article: EnrichedArticle;
  onMarkRead?: (id: string) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}

export function HeroArticle({ article, onMarkRead, pinned, onTogglePin }: HeroArticleProps) {
  const borderColor = getBiasBorderColor(article.bias);
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(article.id);
  const recency = getRecencyBadge(article.publishedAt);

  const handleClick = () => {
    onMarkRead?.(article.id);
  };

  return (
    <div
      className={`group relative bg-surface-secondary rounded-2xl border ${borderColor} hover:border-border-secondary transition-all duration-300 overflow-hidden animate-fade-up`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {article.urlToImage && (
          <div className="relative h-64 lg:h-full min-h-[300px] overflow-hidden">
            <img
              src={article.urlToImage}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface-secondary/90 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-surface-secondary/30 to-transparent lg:hidden" />
          </div>
        )}

        <div className="flex flex-col justify-center p-7 lg:p-10 gap-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/12 border border-red-500/20">
              <Flame size={12} className="text-red-400" />
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
                Top Story
              </span>
            </div>
            {recency && <NewsBadge badge={recency} />}
            <div className="flex items-center gap-1 text-text-muted">
              <BookOpen size={12} />
              <span className="text-xs">{estimateReadTime(article.description)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-muted">
              <Clock size={12} />
              <span className="text-xs">{timeAgo(article.publishedAt)}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {onTogglePin && (
                <button
                  onClick={onTogglePin}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pinned
                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/25"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-tertiary border border-border-primary"
                  }`}
                  title={pinned ? "Unpin story" : "Pin as top story"}
                >
                  <Pin size={12} className={pinned ? "fill-current" : ""} />
                  <span>{pinned ? "Pinned" : "Pin"}</span>
                </button>
              )}
              <ShareButton
                url={article.url}
                title={article.title}
                source={article.source.name}
                size="md"
              />
              <button
                onClick={() => toggleBookmark(article)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  saved
                    ? "text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/25"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-tertiary border border-border-primary"
                }`}
              >
                {saved ? (
                  <>
                    <BookmarkCheck size={14} fill="currentColor" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={14} />
                    <span>Save Article</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-text-secondary">
              {article.source.name}
            </span>
            {article.bias && <BiasBadge bias={article.bias} size="md" />}
          </div>

          {article.reliability !== null && (
            <ReliabilityMeter score={article.reliability} showLabel size="md" />
          )}

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link"
            onClick={handleClick}
          >
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary leading-snug group-hover/link:text-accent-cyan transition-colors">
              {article.title}
            </h2>
          </a>

          {article.description && (
            <p className="text-base text-text-secondary leading-relaxed line-clamp-3">
              {article.description}
            </p>
          )}

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent-cyan transition-colors mt-1"
            onClick={handleClick}
          >
            <ExternalLink size={14} />
            <span>Read full article on {article.sourceDomain}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
