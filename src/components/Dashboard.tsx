"use client";

import { useState, useEffect, useCallback } from "react";
import type { EnrichedArticle, NewsCategory } from "@/types";
import { CategoryNav } from "./CategoryNav";
import { TickerBar } from "./TickerBar";
import { StatsBar } from "./StatsBar";
import { ArticleCard } from "./ArticleCard";
import { HeroArticle } from "./HeroArticle";
import { LoadingState } from "./LoadingState";
import {
  ShieldCheck,
  RefreshCw,
  Crosshair,
  Layers,
} from "lucide-react";

interface FeedData {
  articles: EnrichedArticle[];
  total: number;
  category: string;
}

export function Dashboard() {
  const [category, setCategory] = useState<NewsCategory>("general");
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${category}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const heroArticle =
    data?.articles && data.articles.length > 0 ? data.articles[0] : null;
  const gridArticles =
    data?.articles && data.articles.length > 1 ? data.articles.slice(1) : [];

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-950/95 backdrop-blur-md border-b border-navy-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Crosshair size={20} className="text-accent-cyan" />
                <h1 className="text-lg font-bold font-[var(--font-family-mono)] text-gray-100 tracking-wider uppercase hidden sm:block">
                  Intel Briefing
                </h1>
                <h1 className="text-lg font-bold font-[var(--font-family-mono)] text-gray-100 tracking-wider uppercase sm:hidden">
                  INTL
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck size={11} className="text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Multi-Source Analysis
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[10px] text-gray-500 hidden sm:block">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-accent-cyan hover:bg-navy-800 transition-all border border-navy-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={12}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <CategoryNav
            activeCategory={category}
            onCategoryChange={setCategory}
          />
        </div>
      </header>

      {/* Ticker */}
      {data?.articles && data.articles.length > 0 && (
        <TickerBar articles={data.articles} />
      )}

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        {data && (
          <StatsBar articles={data.articles || []} total={data.total} />
        )}

        {loading && <LoadingState />}

        {!loading && data && (
          <>
            {/* Hero / Top Story */}
            {heroArticle && <HeroArticle article={heroArticle} />}

            {/* Article grid */}
            {gridArticles.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-accent-cyan" />
                  <h2 className="text-sm font-bold font-[var(--font-family-mono)] text-accent-cyan uppercase tracking-wider">
                    Latest Coverage
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gridArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {(!data.articles || data.articles.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Crosshair size={48} className="mb-4 text-navy-600" />
                <p className="text-lg font-medium">
                  No intelligence data available
                </p>
                <p className="text-sm mt-1">
                  Try refreshing or selecting a different category
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-6 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Crosshair size={12} />
              <span className="font-[var(--font-family-mono)] uppercase tracking-wider">
                Intel Briefing
              </span>
              <span className="text-gray-700">|</span>
              <span>Multi-perspective news analysis</span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Bias data sourced from publicly available media analysis
              </span>
              <span className="text-gray-700">|</span>
              <span>Read broadly. Think critically.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
