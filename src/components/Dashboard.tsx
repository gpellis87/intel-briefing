"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { EnrichedArticle, NewsCategory, BiasDirection } from "@/types";
import { CategoryNav } from "./CategoryNav";
import { TickerBar } from "./TickerBar";
import { StatsBar } from "./StatsBar";
import { ArticleCard } from "./ArticleCard";
import { ArticleListItem } from "./ArticleListItem";
import { HeroArticle } from "./HeroArticle";
import { LoadingState } from "./LoadingState";
import { ThemePicker } from "./ThemePicker";
import { DensityPicker } from "./DensityPicker";
import { SearchBar } from "./SearchBar";
import { BiasFilter } from "./BiasFilter";
import { TimeFilter, passesTimeFilter, type TimeRange } from "./TimeFilter";
import { ViewToggle, useViewMode } from "./ViewToggle";
import { TrendingTopics } from "./TrendingTopics";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { BackToTop } from "./BackToTop";
import { ArticlePreview } from "./ArticlePreview";
import { SourceDirectory, useSourceFilter } from "./SourceDirectory";
import { StoryCluster } from "./StoryCluster";
import { DailyDigest } from "./DailyDigest";
import { LocalNewsPrompt, LocationBadge, useLocalLocation } from "./LocalNews";
import { ScoresTicker } from "./ScoresTicker";
import { MarketTicker } from "./MarketTicker";
import { WeatherWidget } from "./WeatherWidget";
import { WelcomeBanner } from "./WelcomeBanner";
import { Tooltip } from "./Tooltip";
import { KeywordAlerts } from "./KeywordAlerts";
import { ReadingHistory } from "./ReadingHistory";
import { PopularBadge } from "./PopularBadge";
import { clusterArticles, type StoryClusterData } from "@/lib/story-clustering";
import { useReadTracker } from "@/hooks/useReadTracker";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useKeywordAlerts } from "@/hooks/useKeywordAlerts";
import {
  ShieldCheck, RefreshCw, Crosshair, Layers, Bell,
  BookmarkCheck, CheckCheck, Eye, EyeOff, Keyboard,
  Filter, Newspaper, ChevronDown, Radar, History,
  BarChart3,
} from "lucide-react";
import { useBookmarks } from "@/context/BookmarkContext";
import Link from "next/link";

interface FeedData {
  articles: EnrichedArticle[];
  total: number;
  category: string;
}

type BiasFilterValue = "all" | BiasDirection;

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PAGE_SIZE = 20;
const HERO_PERSIST_MS = 30 * 60 * 1000;

const SPORTS_DOMAINS = new Set([
  "espn.com", "cbssports.com", "sports.yahoo.com", "bleacherreport.com",
  "foxsports.com", "nbcsports.com", "theathletic.com", "si.com",
  "deadspin.com", "motorsport.com", "crash.net", "racefans.net",
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
  const [timeFilter, setTimeFilter] = useState<TimeRange>("all");
  const [newArticleCount, setNewArticleCount] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [hideRead, setHideRead] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [clustered, setClustered] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<EnrichedArticle | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pinnedHeroId, setPinnedHeroId] = useState<string | null>(null);
  const [popularIds, setPopularIds] = useState<Set<string>>(new Set());
  const previousArticleIds = useRef<Set<string>>(new Set());
  const heroRef = useRef<{ id: string; setAt: number } | null>(null);

  const { viewMode, setViewMode } = useViewMode();
  const { isBookmarked, toggleBookmark, getSavedArticles, count: bookmarkCount } = useBookmarks();
  const { isRead, markRead, markAllRead, getHistory } = useReadTracker();
  const { excluded, toggleSource, clearAll: clearSourceFilter, excludedCount, isExcluded } = useSourceFilter();
  const { location, setLocation } = useLocalLocation();
  const { keywords, addKeyword, removeKeyword, matchesAlert, count: alertCount } = useKeywordAlerts();

  // Fetch popular articles for boosting
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch("/api/popular");
        const data = await res.json();
        if (data.popular?.length > 0) {
          setPopularIds(new Set(data.popular.map((p: { articleId: string }) => p.articleId)));
        }
      } catch { /* silent */ }
    };
    fetchPopular();
    const interval = setInterval(fetchPopular, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const trackClick = useCallback(async (articleId: string) => {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action: "click", category }),
      });
    } catch { /* non-blocking */ }
  }, [category]);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        let json: FeedData;

        if (category === "local") {
          if (!location) {
            setLoading(false);
            return;
          }
          const res = await fetch(
            `/api/local-news?city=${encodeURIComponent(location.city)}&state=${encodeURIComponent(location.state)}`
          );
          json = await res.json();
        } else {
          const res = await fetch(`/api/news?category=${category}`);
          json = await res.json();
        }

        if (silent && data) {
          const currentIds = new Set(data.articles.map((a) => a.id));
          const newIds = json.articles.filter((a) => !currentIds.has(a.id));
          if (newIds.length > 0) {
            setNewArticleCount(newIds.length);
          }
        } else {
          setData(json);
          previousArticleIds.current = new Set(json.articles.map((a) => a.id));
          setNewArticleCount(0);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    },
    [category, data, location]
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
    if (category === "local" && !location) {
      setData(null);
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, location]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, biasFilter, search, timeFilter, showBookmarks, hideRead, clustered]);

  // Compute source counts for articles (for breaking badge)
  const sourceCountMap = useMemo(() => {
    if (!data?.articles) return new Map<string, number>();
    const clusters = clusterArticles(data.articles);
    const map = new Map<string, number>();
    for (const cluster of clusters) {
      for (const article of cluster.articles) {
        map.set(article.id, cluster.articles.length);
      }
    }
    return map;
  }, [data]);

  const filteredArticles = useMemo(() => {
    let articles: EnrichedArticle[];

    if (showBookmarks) {
      articles = getSavedArticles();
    } else if (!data?.articles) {
      return [];
    } else {
      articles = data.articles;
    }

    if (hideRead && !showBookmarks) {
      articles = articles.filter((a) => !isRead(a.id));
    }

    if (biasFilter !== "all") {
      articles = articles.filter((a) => a.biasDirection === biasFilter);
    }

    if (timeFilter !== "all") {
      articles = articles.filter((a) => passesTimeFilter(a.publishedAt, timeFilter));
    }

    if (excludedCount > 0) {
      articles = articles.filter((a) => !isExcluded(a.sourceDomain));
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
  }, [data, biasFilter, search, showBookmarks, getSavedArticles, hideRead, isRead, timeFilter, excludedCount, isExcluded]);

  // Hero article with 30-min persistence + pin support
  const heroArticle = useMemo(() => {
    if (showBookmarks || filteredArticles.length === 0 || clustered) return null;

    // If pinned, find that article
    if (pinnedHeroId) {
      const pinned = filteredArticles.find((a) => a.id === pinnedHeroId);
      if (pinned) return pinned;
      setPinnedHeroId(null);
    }

    // Check if current hero is still valid and within persistence window
    if (heroRef.current) {
      const elapsed = Date.now() - heroRef.current.setAt;
      const currentHero = filteredArticles.find((a) => a.id === heroRef.current!.id);
      if (currentHero && elapsed < HERO_PERSIST_MS) {
        // Only override if a new story has 3+ sources (truly bigger news)
        const candidate = category === "sports"
          ? filteredArticles[0]
          : filteredArticles.find((a) => !isSportsSource(a)) || filteredArticles[0];
        const candidateSources = sourceCountMap.get(candidate?.id || "") || 0;
        if (candidateSources < 3) return currentHero;
      }
    }

    const selected = category === "sports"
      ? filteredArticles[0]
      : filteredArticles.find((a) => !isSportsSource(a)) || filteredArticles[0];

    if (selected) {
      heroRef.current = { id: selected.id, setAt: Date.now() };
    }

    return selected || null;
  }, [filteredArticles, showBookmarks, category, clustered, pinnedHeroId, sourceCountMap]);

  const afterHeroArticles = useMemo(() => {
    if (showBookmarks) return filteredArticles;
    if (!heroArticle) return filteredArticles;
    return filteredArticles.filter((a) => a.id !== heroArticle.id);
  }, [filteredArticles, heroArticle, showBookmarks]);

  const clusters = useMemo((): StoryClusterData[] => {
    if (!clustered) return [];
    return clusterArticles(afterHeroArticles);
  }, [afterHeroArticles, clustered]);

  const paginatedArticles = useMemo(() => {
    return afterHeroArticles.slice(0, visibleCount);
  }, [afterHeroArticles, visibleCount]);

  const hasMore = afterHeroArticles.length > visibleCount;

  const trendingArticles = useMemo(
    () => (data?.articles || []).map((a) => ({ title: a.title, publishedAt: a.publishedAt })),
    [data]
  );

  const handleOpenArticle = useCallback(
    (article: EnrichedArticle) => {
      markRead(article.id, {
        title: article.title,
        url: article.url,
        source: article.source.name,
      });
      trackClick(article.id);
      window.open(article.url, "_blank", "noopener,noreferrer");
    },
    [markRead, trackClick]
  );

  const handleMarkAllRead = useCallback(() => {
    if (data?.articles) {
      markAllRead(data.articles.map((a) => a.id));
    }
  }, [data, markAllRead]);

  const handleKeyboardBookmark = useCallback(
    (id: string) => {
      const article = paginatedArticles.find((a) => a.id === id);
      if (article) toggleBookmark(article);
    },
    [paginatedArticles, toggleBookmark]
  );

  const { focusIndex } = useKeyboardNav({
    articles: paginatedArticles,
    onOpenArticle: handleOpenArticle,
    onToggleBookmark: handleKeyboardBookmark,
    onShowHelp: useCallback(() => setShowShortcuts(true), []),
    enabled: !showShortcuts && !previewArticle && !showSources && !showDigest && !showAlerts && !showHistory,
  });

  const showLocalPrompt = category === "local" && !location;
  const history = getHistory();

  const Divider = () => (
    <div className="h-5 border-l border-border-primary mx-0.5 hidden sm:block" />
  );

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
              {category === "local" && location && (
                <LocationBadge
                  city={location.city}
                  state={location.state}
                  onEdit={() => setLocation(null)}
                />
              )}
              <WeatherWidget />
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <SearchBar value={search} onChange={setSearch} />

              {/* Reading group */}
              <Tooltip text="View saved articles">
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    showBookmarks
                      ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                      : "text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary border-border-primary"
                  }`}
                >
                  <BookmarkCheck size={13} fill={showBookmarks ? "currentColor" : "none"} />
                  <span className="hidden sm:inline">
                    {bookmarkCount > 0 ? `Saved (${bookmarkCount})` : "Saved"}
                  </span>
                </button>
              </Tooltip>

              <Tooltip text="Reading history">
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
                >
                  <History size={13} />
                  <span className="hidden lg:inline">History</span>
                </button>
              </Tooltip>

              <Tooltip text={hideRead ? "Show read articles" : "Hide articles you've read"}>
                <button
                  onClick={() => setHideRead(!hideRead)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    hideRead
                      ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                      : "text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary border-border-primary"
                  }`}
                >
                  {hideRead ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span className="hidden sm:inline">{hideRead ? "Show Read" : "Hide Read"}</span>
                </button>
              </Tooltip>

              <Tooltip text="Mark all articles as read">
                <button
                  onClick={handleMarkAllRead}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
                >
                  <CheckCheck size={13} />
                  <span className="hidden md:inline">Mark Read</span>
                </button>
              </Tooltip>

              <Divider />

              {/* Filter group */}
              <Tooltip text="Filter which news sources appear">
                <button
                  onClick={() => setShowSources(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    excludedCount > 0
                      ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                      : "text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary border-border-primary"
                  }`}
                >
                  <Filter size={13} />
                  <span className="hidden sm:inline">
                    Sources{excludedCount > 0 ? ` (${excludedCount})` : ""}
                  </span>
                </button>
              </Tooltip>

              <Tooltip text="Set keyword alerts for topics you care about">
                <button
                  onClick={() => setShowAlerts(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    alertCount > 0
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                      : "text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary border-border-primary"
                  }`}
                >
                  <Radar size={13} />
                  <span className="hidden lg:inline">
                    Alerts{alertCount > 0 ? ` (${alertCount})` : ""}
                  </span>
                </button>
              </Tooltip>

              <DensityPicker />
              <ThemePicker />

              <Divider />

              {/* Extras group */}
              <Tooltip text="Summary across all categories">
                <button
                  onClick={() => setShowDigest(true)}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
                >
                  <Newspaper size={13} />
                  <span className="hidden lg:inline">Briefing</span>
                </button>
              </Tooltip>

              <Tooltip text="Keyboard shortcuts">
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
                >
                  <Keyboard size={13} />
                </button>
              </Tooltip>

              {lastUpdated && (
                <span className="text-[10px] text-text-muted hidden xl:block">
                  {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
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
              setTimeFilter("all");
              setHideRead(false);
              setClustered(false);
              setPinnedHeroId(null);
              heroRef.current = null;
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

      {/* Market Ticker */}
      <MarketTicker />

      {/* Scores Ticker */}
      <ScoresTicker />

      {/* News Ticker */}
      {data?.articles && data.articles.length > 0 && !showBookmarks && !showLocalPrompt && (
        <TickerBar articles={data.articles} />
      )}

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner />

        {/* Local News Prompt */}
        {showLocalPrompt && (
          <LocalNewsPrompt onLocationSet={setLocation} />
        )}

        {/* Stats + Filters */}
        {data && !showBookmarks && !showLocalPrompt && (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <StatsBar articles={data.articles || []} total={data.total} />
            <div className="flex items-center gap-2 flex-wrap">
              <BiasFilter value={biasFilter} onChange={setBiasFilter} />
              <TimeFilter value={timeFilter} onChange={setTimeFilter} />
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <button
                onClick={() => setClustered(!clustered)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  clustered
                    ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25"
                    : "text-text-muted hover:text-text-secondary border-border-primary"
                }`}
                title={clustered ? "Show all articles" : "Group related stories"}
              >
                <Layers size={12} />
                <span className="hidden sm:inline">Group Stories</span>
              </button>
            </div>
          </div>
        )}

        {/* Trending Topics */}
        {data && !showBookmarks && !showLocalPrompt && trendingArticles.length > 0 && (
          <TrendingTopics articles={trendingArticles} onTopicClick={setSearch} activeSearch={search} />
        )}

        {loading && <LoadingState />}

        {!loading && !showLocalPrompt && (
          <>
            {heroArticle && (
              <HeroArticle
                article={heroArticle}
                onMarkRead={(id) => {
                  markRead(id, {
                    title: heroArticle.title,
                    url: heroArticle.url,
                    source: heroArticle.source.name,
                  });
                  trackClick(id);
                }}
                pinned={pinnedHeroId === heroArticle.id}
                onTogglePin={() =>
                  setPinnedHeroId((prev) =>
                    prev === heroArticle.id ? null : heroArticle.id
                  )
                }
              />
            )}

            {clustered ? (
              clusters.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <Layers size={15} className="text-accent-cyan" />
                    <h2 className="text-sm font-bold font-[var(--font-family-mono)] text-accent-cyan uppercase tracking-wider">
                      Story Clusters
                    </h2>
                    <span className="text-xs text-text-muted">
                      ({clusters.length} stories from {afterHeroArticles.length} articles)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                    {clusters.slice(0, visibleCount).map((cluster) => (
                      <StoryCluster
                        key={cluster.id}
                        cluster={cluster}
                        onPreview={setPreviewArticle}
                        onMarkRead={markRead}
                        isRead={isRead}
                      />
                    ))}
                  </div>
                  {clusters.length > visibleCount && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary border border-border-primary text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30 transition-all font-medium text-sm"
                      >
                        <ChevronDown size={16} />
                        Load More ({clusters.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </section>
              )
            ) : (
              paginatedArticles.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <Layers size={15} className="text-accent-cyan" />
                    <h2 className="text-sm font-bold font-[var(--font-family-mono)] text-accent-cyan uppercase tracking-wider">
                      {showBookmarks ? "Saved Articles" : "Latest Coverage"}
                    </h2>
                    <span className="text-xs text-text-muted">
                      ({afterHeroArticles.length})
                    </span>
                  </div>

                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
                      {paginatedArticles.map((article, i) => {
                        const alertMatch = matchesAlert(article.title);
                        return (
                          <div key={article.id} className={alertMatch ? "ring-2 ring-amber-400/40 rounded-2xl" : ""}>
                            <ArticleCard
                              article={article}
                              isRead={isRead(article.id)}
                              onMarkRead={markRead}
                              isFocused={focusIndex === i}
                              index={i}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : viewMode === "list" ? (
                    <div className="space-y-1 stagger-children">
                      {paginatedArticles.map((article, i) => (
                        <ArticleListItem
                          key={article.id}
                          article={article}
                          isRead={isRead(article.id)}
                          onMarkRead={markRead}
                          onPreview={setPreviewArticle}
                          isFocused={focusIndex === i}
                          index={i}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5 stagger-children">
                      {paginatedArticles.map((article, i) => (
                        <ArticleListItem
                          key={article.id}
                          article={article}
                          isRead={isRead(article.id)}
                          onMarkRead={markRead}
                          onPreview={setPreviewArticle}
                          isFocused={focusIndex === i}
                          index={i}
                          showImage={false}
                        />
                      ))}
                    </div>
                  )}

                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary border border-border-primary text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30 transition-all font-medium text-sm"
                      >
                        <ChevronDown size={16} />
                        Load More ({afterHeroArticles.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </section>
              )
            )}

            {filteredArticles.length === 0 && !showLocalPrompt && (
              <div className="flex flex-col items-center justify-center py-24 text-text-muted animate-fade-in">
                <Crosshair size={48} className="mb-4 text-surface-elevated" />
                <p className="text-lg font-medium text-text-secondary">
                  {showBookmarks
                    ? "No saved articles yet"
                    : category === "local"
                      ? `No local news found for ${location?.city || "your area"}`
                      : hideRead
                        ? "All articles have been read"
                        : search
                          ? "No articles match your search"
                          : "No intelligence data available"}
                </p>
                <p className="text-sm mt-2">
                  {showBookmarks
                    ? "Click the Save button on any article to keep it here permanently"
                    : category === "local"
                      ? "Try a different location or check back later"
                      : hideRead
                        ? "Toggle Hide Read to show all articles"
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
              <Link
                href="/analytics"
                className="inline-flex items-center gap-1 text-text-muted hover:text-accent-cyan transition-colors"
              >
                <BarChart3 size={11} />
                <span>Analytics</span>
              </Link>
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

      {/* Overlays */}
      <BackToTop />
      <ArticlePreview article={previewArticle} onClose={() => setPreviewArticle(null)} onMarkRead={markRead} />
      <SourceDirectory
        open={showSources}
        onClose={() => setShowSources(false)}
        excluded={excluded}
        onToggleSource={toggleSource}
        onClearAll={clearSourceFilter}
        onQuickFilter={(domains) => {
          clearSourceFilter();
          domains.forEach(toggleSource);
        }}
      />
      <DailyDigest open={showDigest} onClose={() => setShowDigest(false)} />
      <KeywordAlerts
        open={showAlerts}
        onClose={() => setShowAlerts(false)}
        keywords={keywords}
        onAdd={addKeyword}
        onRemove={removeKeyword}
      />
      <ReadingHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
      />
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
