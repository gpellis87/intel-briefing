"use client";

import { useState, useEffect, useMemo } from "react";
import type { EnrichedArticle } from "@/types";
import { BiasBadge } from "./BiasBadge";
import { ReliabilityMeter } from "./ReliabilityMeter";
import { ShareButton } from "./ShareButton";
import { timeAgo, estimateReadTime } from "@/lib/utils";
import {
  Newspaper, Landmark, Cpu, TrendingUp,
  FlaskConical, HeartPulse, Trophy, Film,
  ExternalLink, Clock, BookOpen, X,
} from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  general: { label: "Headlines", icon: Newspaper },
  politics: { label: "Politics", icon: Landmark },
  technology: { label: "Technology", icon: Cpu },
  business: { label: "Business", icon: TrendingUp },
  science: { label: "Science", icon: FlaskConical },
  health: { label: "Health", icon: HeartPulse },
  sports: { label: "Sports", icon: Trophy },
  entertainment: { label: "Entertainment", icon: Film },
};

const CATEGORIES_TO_FETCH = ["general", "politics", "technology", "business", "science", "health", "sports", "entertainment"];

interface DigestSection {
  category: string;
  articles: EnrichedArticle[];
}

interface DailyDigestProps {
  open: boolean;
  onClose: () => void;
}

export function DailyDigest({ open, onClose }: DailyDigestProps) {
  const [sections, setSections] = useState<DigestSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);

    setLoading(true);
    Promise.allSettled(
      CATEGORIES_TO_FETCH.map(async (cat) => {
        const res = await fetch(`/api/news?category=${cat}`);
        const data = await res.json();
        return { category: cat, articles: (data.articles || []).slice(0, 2) as EnrichedArticle[] };
      })
    ).then((results) => {
      const loaded: DigestSection[] = [];
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.articles.length > 0) {
          loaded.push(r.value);
        }
      }
      setSections(loaded);
      setLoading(false);
    });

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-primary overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-primary/95 backdrop-blur-sm border-b border-border-primary">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary font-[var(--font-family-mono)] uppercase tracking-wider">
              Daily Briefing
            </h1>
            <p className="text-xs text-text-muted mt-0.5">{todayStr}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-5 w-32 bg-surface-tertiary rounded" />
                <div className="h-6 w-full bg-surface-tertiary rounded" />
                <div className="h-4 w-3/4 bg-surface-tertiary/60 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => {
              const config = categoryConfig[section.category];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <section key={section.category} className="space-y-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border-primary">
                    <Icon size={18} className="text-accent-cyan" />
                    <h2 className="text-sm font-bold text-accent-cyan uppercase tracking-wider font-[var(--font-family-mono)]">
                      {config.label}
                    </h2>
                  </div>

                  {section.articles.map((article) => (
                    <article key={article.id} className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-semibold text-text-secondary">
                          {article.source.name}
                        </span>
                        {article.bias && <BiasBadge bias={article.bias} size="md" />}
                        {article.reliability !== null && (
                          <ReliabilityMeter score={article.reliability} showLabel />
                        )}
                      </div>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <h3 className="text-lg font-bold text-text-primary leading-snug group-hover:text-accent-cyan transition-colors">
                          {article.title}
                        </h3>
                      </a>

                      {article.description && (
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {article.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{timeAgo(article.publishedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen size={11} />
                          <span>{estimateReadTime(article.description)}</span>
                        </div>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-accent-cyan transition-colors"
                        >
                          <ExternalLink size={11} />
                          <span>Read full article</span>
                        </a>
                        <ShareButton url={article.url} title={article.title} source={article.source.name} size="sm" />
                      </div>
                    </article>
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
