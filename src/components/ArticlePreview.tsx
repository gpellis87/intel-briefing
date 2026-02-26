"use client";

import { useEffect, useRef } from "react";
import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { NewsBadge } from "./NewsBadge";
import { ShareButton } from "./ShareButton";
import { timeAgo, getRecencyBadge, estimateReadTime, formatPublishTime } from "@/lib/utils";
import {
  X, ExternalLink, Clock, BookmarkPlus, BookmarkCheck, BookOpen,
} from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface ArticlePreviewProps {
  article: EnrichedArticle | null;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
}

export function ArticlePreview({ article, onClose, onMarkRead }: ArticlePreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    if (!article) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [article, onClose]);

  if (!article) return null;

  const saved = isBookmarked(article.id);
  const recency = getRecencyBadge(article.publishedAt);

  const handleOpen = () => {
    onMarkRead?.(article.id);
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={ref}
        className="relative w-full max-w-lg bg-surface-secondary border-l border-border-primary shadow-2xl overflow-y-auto animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-secondary/95 backdrop-blur-sm border-b border-border-primary">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Preview
            </span>
            {recency && <NewsBadge badge={recency} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image */}
        {article.urlToImage && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={article.urlToImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-transparent to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Source row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-text-secondary">
              {article.source.name}
            </span>
            {article.bias && <BiasBadge bias={article.bias} size="md" />}
          </div>

          {article.reliability !== null && (
            <ReliabilityMeter score={article.reliability} showLabel size="md" />
          )}

          {/* Title */}
          <h2 className="text-xl font-bold text-text-primary leading-snug">
            {article.title}
          </h2>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatPublishTime(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen size={12} />
              <span>{estimateReadTime(article.description)}</span>
            </div>
          </div>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleOpen}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-cyan text-surface-primary font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={15} />
              Read Full Article
            </button>

            <button
              onClick={() => toggleBookmark(article)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                saved
                  ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                  : "text-text-secondary border-border-secondary hover:bg-surface-tertiary"
              }`}
            >
              {saved ? (
                <BookmarkCheck size={15} fill="currentColor" />
              ) : (
                <BookmarkPlus size={15} />
              )}
              {saved ? "Saved" : "Save"}
            </button>

            <ShareButton
              url={article.url}
              title={article.title}
              source={article.source.name}
              size="md"
            />
          </div>

          {/* Source link */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors"
            onClick={() => onMarkRead?.(article.id)}
          >
            <ExternalLink size={11} />
            <span>{article.sourceDomain}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
