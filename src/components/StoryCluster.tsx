"use client";

import { useState } from "react";
import type { StoryClusterData } from "@/lib/story-clustering";
import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { NewsBadge } from "./NewsBadge";
import { ShareButton } from "./ShareButton";
import { getBiasBorderColor, timeAgo, getRecencyBadge, estimateReadTime } from "@/lib/utils";
import {
  ExternalLink, Clock, ChevronDown, ChevronUp,
  BookmarkPlus, BookmarkCheck, Layers, BookOpen,
} from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface StoryClusterProps {
  cluster: StoryClusterData;
  onPreview?: (article: EnrichedArticle) => void;
  onMarkRead?: (id: string, meta?: { title?: string; url?: string; source?: string }) => void;
  isRead?: (id: string) => boolean;
}

export function StoryCluster({ cluster, onPreview, onMarkRead, isRead }: StoryClusterProps) {
  const [expanded, setExpanded] = useState(false);
  const { lead, articles } = cluster;
  const otherArticles = articles.filter((a) => a.id !== lead.id);
  const borderColor = getBiasBorderColor(lead.bias);
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(lead.id);
  const recency = getRecencyBadge(lead.publishedAt);

  const biasDistribution = articles.reduce(
    (acc, a) => {
      if (a.biasDirection === "left") acc.left++;
      else if (a.biasDirection === "right") acc.right++;
      else if (a.biasDirection === "center") acc.center++;
      return acc;
    },
    { left: 0, center: 0, right: 0 }
  );
  const total = biasDistribution.left + biasDistribution.center + biasDistribution.right;

  return (
    <div className={`bg-surface-secondary rounded-2xl border ${borderColor} overflow-hidden transition-all duration-300`}>
      {/* Lead article */}
      <div className="group">
        {lead.urlToImage && (
          <div className="relative h-44 overflow-hidden">
            <img
              src={lead.urlToImage}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-transparent to-transparent" />

            {/* Coverage badge */}
            {articles.length > 1 && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-primary/80 backdrop-blur-md border border-border-primary">
                <Layers size={11} className="text-accent-cyan" />
                <span className="text-[10px] font-bold text-accent-cyan">
                  {articles.length} sources
                </span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                toggleBookmark(lead);
              }}
              className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-[11px] font-semibold transition-all ${
                saved
                  ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                  : "bg-black/40 text-white/80 border border-white/10 opacity-0 group-hover:opacity-100"
              }`}
            >
              {saved ? <BookmarkCheck size={13} fill="currentColor" /> : <BookmarkPlus size={13} />}
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>
        )}

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                {lead.source.name}
              </span>
              {lead.bias && <BiasBadge bias={lead.bias} />}
              {recency && <NewsBadge badge={recency} />}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-text-muted">
                <BookOpen size={10} />
                <span className="text-[10px]">{estimateReadTime(lead.description)}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <Clock size={10} />
                <span className="text-[10px]">{timeAgo(lead.publishedAt)}</span>
              </div>
            </div>
          </div>

          {lead.reliability !== null && (
            <ReliabilityMeter score={lead.reliability} showLabel />
          )}

          <button onClick={() => onPreview?.(lead)} className="text-left w-full">
            <h3 className="text-[15px] font-semibold leading-snug text-text-primary hover:text-accent-cyan transition-colors line-clamp-3">
              {lead.title}
            </h3>
          </button>

          {lead.description && (
            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
              {lead.description}
            </p>
          )}

          {/* Bias distribution mini-bar */}
          {total > 0 && articles.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Coverage:</span>
              <div className="flex h-1.5 w-24 rounded-full overflow-hidden bg-surface-tertiary">
                {biasDistribution.left > 0 && (
                  <div className="bg-blue-500 h-full" style={{ width: `${(biasDistribution.left / total) * 100}%` }} />
                )}
                {biasDistribution.center > 0 && (
                  <div className="bg-gray-400 h-full" style={{ width: `${(biasDistribution.center / total) * 100}%` }} />
                )}
                {biasDistribution.right > 0 && (
                  <div className="bg-red-500 h-full" style={{ width: `${(biasDistribution.right / total) * 100}%` }} />
                )}
              </div>
              <span className="text-[10px] text-text-muted">{articles.length} sources</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border-primary">
            <div className="flex items-center gap-1">
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors"
                onClick={() => onMarkRead?.(lead.id, { title: lead.title, url: lead.url, source: lead.source.name })}
              >
                <ExternalLink size={11} />
                <span>{lead.sourceDomain}</span>
              </a>
              <ShareButton url={lead.url} title={lead.title} source={lead.source.name} size="sm" />
            </div>

            {otherArticles.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-accent-cyan font-medium hover:underline"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Hide" : `+${otherArticles.length} more`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded articles */}
      {expanded && otherArticles.length > 0 && (
        <div className="border-t border-border-primary divide-y divide-border-primary/50">
          {otherArticles.map((article) => (
            <div
              key={article.id}
              className={`flex items-center gap-3 px-5 py-3 hover:bg-surface-hover transition-colors ${
                isRead?.(article.id) ? "opacity-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-text-muted uppercase">
                    {article.source.name}
                  </span>
                  {article.bias && <BiasBadge bias={article.bias} />}
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-primary hover:text-accent-cyan transition-colors line-clamp-1"
                  onClick={() => onMarkRead?.(article.id, { title: article.title, url: article.url, source: article.source.name })}
                >
                  {article.title}
                </a>
              </div>
              <span className="text-[10px] text-text-muted flex-shrink-0">
                {timeAgo(article.publishedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
