"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { EnrichedArticle, NewsCategory, BiasDirection } from "@/types";
import { CategoryNav } from "./CategoryNav";
import { TickerBar } from "./TickerBar";
import { StatsBar } from "./StatsBar";
import { ArticleCard } from "./ArticleCard";
import { HeroArticle } from "./HeroArticle";
import { LoadingState } from "./LoadingState";
import { ThemePicker } from "./ThemePicker";
import { SearchBar } from "./SearchBar";
import { BiasFilter } from "./BiasFilter";
import { TrendingTopics } from "./TrendingTopics";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { useReadTracker } from "@/hooks/useReadTracker";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import {
  ShieldCheck,
  RefreshCw,
  Crosshair,
  Layers,
  Bell,
  BookmarkCheck,
  CheckCheck,
  Eye,
  EyeOff,
  Keyboard,
} from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";

interface FeedData {
  articles: EnrichedArticle[];
  total: number;
  category: string;
}

type BiasFilterValue = "all" | BiasDirection;

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const SPORTS_DOMAINS = new Set([
  "espn.com", "cbssports.com", "sports.yahoo.com", "bleacherreport.com",
  "foxsports.com", "nbcsports.com", "theathletic.com", "si.com",
  "deadspin.com",
]);

function isSportsSource(article: EnrichedArticle): boolean {
  return SPORTS_DOMAINS.has(article.sourceDomain) ||
    article.source.name.toLowerCase().includes("sport");
}

export function Dashboard() {
  const [category, setCategory] = useState<NewsCategory>("general");
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [biasFilter, setBiasFilter] = useState<BiasFilterValue>("all");
  const [newArticleCount, setNewArticleCount] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [hideRead, setHideRead] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const previousArticleIds = useRef<Set<string>>(new Set());
  const { isBookmarked, toggleBookmark, getSavedArticles, count: bookmarkCount } = useBookmarks();
  const { isRead, markRead, markAllRead } = useReadTracker();

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${category}`);
        const json: FeedData = await res.json();

        if (silent && data) {
          const currentIds = new Set(data.articles.map((a) => a.id));
          const newIds = json.articles.filter((a) => !currentIds.has(a.id));
          if (newIds.length > 0) {
            setNewArticleCount(newIds.length);
          }
        } else {
          setData(json);
          previousArticleIds.current = new Set(
            json.articles.map((a) => a.id)
          );
          setNewArticleCount(0);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    },
    [category, data]
  );

  const applyNewArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${category}`);
      const json: FeedData = await res.json();
      setData(json);
      previousArticleIds.current = new Set(json.articles.map((a) => a.id));
      setNewArticleCount(0);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredArticles = useMemo(() => {
    if (showBookmarks) {
      let articles = getSavedArticles();

      if (biasFilter !== "all") {
        articles = articles.filter((a) => a.biasDirection === biasFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        articles = articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.source.name.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        );
      }
      return articles;
    }

    if (!data?.articles) return [];
    let articles = data.articles;

    if (hideRead) {
      articles = articles.filter((a) => !isRead(a.id));
    }

    if (biasFilter !== "all") {
      articles = articles.filter((a) => a.biasDirection === biasFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.source.name.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    return articles;
  }, [data, biasFilter, search, showBookmarks, getSavedArticles, hideRead, isRead]);

  const heroArticle = useMemo(() => {
    if (showBookmarks || filteredArticles.length === 0) return null;
    if (category === "sports") return filteredArticles[0];
    const nonSports = filteredArticles.find((a) => !isSportsSource(a));
    return nonSports || filteredArticles[0];
  }, [filteredArticles, showBookmarks, category]);

  const gridArticles = useMemo(() => {
    if (showBookmarks) return filteredArticles;
    if (!heroArticle) return filteredArticles;
    return filteredArticles.filter((a) => a.id !== heroArticle.id);
  }, [filteredArticles, heroArticle, showBookmarks]);

  const allTitles = useMemo(
    () => (data?.articles || []).map((a) => a.title),
    [data]
  );

  const handleOpenArticle = useCallback(
    (article: EnrichedArticle) => {
      markRead(article.id);
      window.open(article.url, "_blank", "noopener,noreferrer");
    },
    [markRead]
  );

  const handleMarkAllRead = useCallback(() => {
    if (data?.articles) {
      markAllRead(data.articles.map((a) => a.id));
    }
  }, [data, markAllRead]);

  const handleKeyboardBookmark = useCallback(
    (id: string) => {
      const article = gridArticles.find((a) => a.id === id);
      if (article) toggleBookmark(article);
    },
    [gridArticles, toggleBookmark]
  );

  const { focusIndex } = useKeyboardNav({
    articles: gridArticles,
    onOpenArticle: handleOpenArticle,
    onToggleBookmark: handleKeyboardBookmark,
    onShowHelp: useCallback(() => setShowShortcuts(true), []),
    enabled: !showShortcuts,
  });

  return (
    <div className="min-h-screen bg-surface-primary transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-primary/90 backdrop-blur-xl border-b border-border-primary">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <Crosshair size={20} className="text-accent-cyan" />
                <h1 className="text-lg font-bold font-[var(--font-family-mono)] text-text-primary tracking-wider uppercase hidden sm:block">
                  Intel Briefing
                </h1>
                <h1 className="text-lg font-bold font-[var(--font-family-mono)] text-text-primary tracking-wider uppercase sm:hidden">
                  INTL
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck size={11} className="text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Multi-Source
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <SearchBar value={search} onChange={setSearch} />

              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  showBookmarks
                    ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                    : "text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary border-border-primary"
                }`}
                aria-label="Saved articles"
                title="View saved articles"
              >
                <BookmarkCheck size={13} fill={showBookmarks ? "currentColor" : "none"} />
                <span className="hidden sm:inline">
                  {bookmarkCount > 0 ? `Saved (${bookmarkCount})` : "Saved"}
                </span>
              </button>

              <button
                onClick={() => setHideRead(!hideRead)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  hideRead
                    ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                    : "text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary border-border-primary"
                }`}
                aria-label={hideRead ? "Show read articles" : "Hide read articles"}
                title={hideRead ? "Show read articles" : "Hide read articles"}
              >
                {hideRead ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>

              <button
                onClick={handleMarkAllRead}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
                aria-label="Mark all read"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
              </button>

              <ThemePicker />

              <button
                onClick={() => setShowShortcuts(true)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts"
              >
                <Keyboard size={13} />
              </button>

              {lastUpdated && (
                <span className="text-[10px] text-text-muted hidden lg:block">
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}

              <button
                onClick={() => {
                  setNewArticleCount(0);
                  fetchData();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <CategoryNav
            activeCategory={category}
            onCategoryChange={(c) => {
              setCategory(c);
              setShowBookmarks(false);
              setSearch("");
              setBiasFilter("all");
              setHideRead(false);
            }}
          />
        </div>
      </header>

      {/* New articles toast */}
      {newArticleCount > 0 && (
        <div className="sticky top-[calc(7rem)] z-30 flex justify-center pointer-events-none">
          <button
            onClick={applyNewArticles}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent-cyan text-surface-primary font-medium text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-slide-down"
          >
            <Bell size={14} />
            {newArticleCount} new {newArticleCount === 1 ? "article" : "articles"} available
          </button>
        </div>
      )}

      {/* Ticker */}
      {data?.articles && data.articles.length > 0 && !showBookmarks && (
        <TickerBar articles={data.articles} />
      )}

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats + Filters */}
        {data && !showBookmarks && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <StatsBar articles={data.articles || []} total={data.total} />
            <BiasFilter value={biasFilter} onChange={setBiasFilter} />
          </div>
        )}

        {/* Trending Topics */}
        {data && !showBookmarks && allTitles.length > 0 && (
          <TrendingTopics
            titles={allTitles}
            onTopicClick={setSearch}
            activeSearch={search}
          />
        )}

        {loading && <LoadingState />}

        {!loading && (
          <>
            {heroArticle && (
              <HeroArticle article={heroArticle} onMarkRead={markRead} />
            )}

            {gridArticles.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <Layers size={15} className="text-accent-cyan" />
                  <h2 className="text-sm font-bold font-[var(--font-family-mono)] text-accent-cyan uppercase tracking-wider">
                    {showBookmarks ? "Saved Articles" : "Latest Coverage"}
                  </h2>
                  <span className="text-xs text-text-muted">
                    ({gridArticles.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
                  {gridArticles.map((article, i) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isRead={isRead(article.id)}
                      onMarkRead={markRead}
                      isFocused={focusIndex === i}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredArticles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-text-muted animate-fade-in">
                <Crosshair size={48} className="mb-4 text-surface-elevated" />
                <p className="text-lg font-medium text-text-secondary">
                  {showBookmarks
                    ? "No saved articles yet"
                    : hideRead
                      ? "All articles have been read"
                      : search
                        ? "No articles match your search"
                        : "No intelligence data available"}
                </p>
                <p className="text-sm mt-2">
                  {showBookmarks
                    ? "Click the Save button on any article to keep it here permanently"
                    : hideRead
                      ? "Toggle the eye icon to show read articles"
                      : search
                        ? "Try a different search term"
                        : "Try refreshing or selecting a different category"}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-primary py-8 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-2.5">
              <Crosshair size={12} />
              <span className="font-[var(--font-family-mono)] uppercase tracking-wider">
                Intel Briefing
              </span>
              <span className="text-border-secondary">|</span>
              <span>Multi-perspective news analysis</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Read broadly. Think critically.</span>
              <button
                onClick={() => setShowShortcuts(true)}
                className="hidden sm:inline-flex items-center gap-1 text-text-muted hover:text-accent-cyan transition-colors"
              >
                <Keyboard size={11} />
                <span>Shortcuts</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
