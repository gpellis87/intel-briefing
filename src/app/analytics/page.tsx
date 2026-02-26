"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Crosshair, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PopularArticle {
  articleId: string;
  clicks: number;
}

interface AnalyticsData {
  popular: PopularArticle[];
  categories: Record<string, number>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/popular")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalClicks = data?.popular.reduce((sum, p) => sum + p.clicks, 0) || 0;
  const totalCategories = Object.values(data?.categories || {}).reduce(
    (sum, c) => sum + Number(c),
    0
  );

  const sortedCategories = Object.entries(data?.categories || {})
    .map(([name, count]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count);

  const maxCatCount = sortedCategories[0]?.count || 1;

  return (
    <div className="min-h-screen bg-surface-primary">
      <header className="sticky top-0 z-40 bg-surface-primary/90 backdrop-blur-xl border-b border-border-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-muted hover:text-accent-cyan transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <BarChart3 size={20} className="text-accent-cyan" />
            <h1 className="text-lg font-bold font-[var(--font-family-mono)] text-text-primary tracking-wider uppercase">
              Analytics
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Total Clicks Today
                </div>
                <div className="text-3xl font-bold text-text-primary tabular-nums">
                  {totalClicks.toLocaleString()}
                </div>
              </div>
              <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Top Articles
                </div>
                <div className="text-3xl font-bold text-text-primary tabular-nums">
                  {data?.popular.length || 0}
                </div>
              </div>
              <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Category Views
                </div>
                <div className="text-3xl font-bold text-text-primary tabular-nums">
                  {totalCategories.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            {sortedCategories.length > 0 && (
              <section className="bg-surface-secondary border border-border-primary rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-accent-cyan uppercase tracking-wider font-[var(--font-family-mono)] flex items-center gap-2">
                  <TrendingUp size={15} />
                  Category Popularity
                </h2>
                <div className="space-y-3">
                  {sortedCategories.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-primary font-medium capitalize">
                          {cat.name}
                        </span>
                        <span className="text-xs text-text-muted tabular-nums">
                          {cat.count} views
                        </span>
                      </div>
                      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-cyan/60 rounded-full transition-all duration-500"
                          style={{
                            width: `${(cat.count / maxCatCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular articles */}
            {(data?.popular.length || 0) > 0 && (
              <section className="bg-surface-secondary border border-border-primary rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-accent-cyan uppercase tracking-wider font-[var(--font-family-mono)] flex items-center gap-2">
                  <Crosshair size={15} />
                  Most Clicked Articles
                </h2>
                <div className="divide-y divide-border-primary/50">
                  {data?.popular.map((article, i) => (
                    <div
                      key={article.articleId}
                      className="flex items-center gap-4 py-3"
                    >
                      <span className="text-lg font-bold text-text-muted tabular-nums w-8 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium truncate">
                          {article.articleId}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-accent-cyan tabular-nums">
                        {article.clicks} clicks
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {totalClicks === 0 && sortedCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <BarChart3 size={48} className="mb-4 text-surface-elevated" />
                <p className="text-lg font-medium text-text-secondary">
                  No analytics data yet
                </p>
                <p className="text-sm mt-2">
                  Data will appear as readers interact with articles
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
