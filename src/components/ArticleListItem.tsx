"use client";

import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { NewsBadge } from "./NewsBadge";
import { ShareButton } from "./ShareButton";
import { timeAgo, getRecencyBadge, estimateReadTime } from "@/lib/utils";
import { ExternalLink, Clock, BookmarkPlus, BookmarkCheck, BookOpen } from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface ArticleListItemProps {
  article: EnrichedArticle;
  isRead?: boolean;
  onMarkRead?: (id: string) => void;
  onPreview?: (article: EnrichedArticle) => void;
  isFocused?: boolean;
  index?: number;
  showImage?: boolean;
}

export function ArticleListItem({
  article,
  isRead = false,
  onMarkRead,
  onPreview,
  isFocused = false,
  index,
  showImage = true,
}: ArticleListItemProps) {
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(article.id);
  const recency = getRecencyBadge(article.publishedAt);

  return (
    <div
      data-article-index={index}
      className={`group flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent hover:bg-surface-secondary hover:border-border-primary transition-all ${
        isFocused ? "keyboard-focus bg-surface-secondary" : ""
      } ${isRead ? "article-read" : ""}`}
    >
      {showImage && article.urlToImage && (
        <img
          src={article.urlToImage}
          alt=""
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 hidden sm:block"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {article.source.name}
          </span>
          {article.bias && <BiasBadge bias={article.bias} />}
          {recency && <NewsBadge badge={recency} />}
        </div>
        <button
          onClick={() => onPreview ? onPreview(article) : undefined}
          className="text-left w-full"
        >
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-1 group-hover:text-accent-cyan transition-colors">
            {article.title}
          </h3>
        </button>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden md:flex items-center gap-1 text-text-muted">
          <BookOpen size={10} />
          <span className="text-[10px]">{estimateReadTime(article.description)}</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Clock size={10} />
          <span className="text-[10px] whitespace-nowrap">{timeAgo(article.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShareButton url={article.url} title={article.title} source={article.source.name} size="sm" />
          <button
            onClick={() => toggleBookmark(article)}
            className={`p-1.5 rounded-lg transition-colors ${
              saved ? "text-accent-cyan opacity-100" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {saved ? <BookmarkCheck size={12} fill="currentColor" /> : <BookmarkPlus size={12} />}
          </button>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-text-muted hover:text-accent-cyan transition-colors"
          onClick={() => onMarkRead?.(article.id)}
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
