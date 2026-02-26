import type { NewsArticle, EnrichedArticle, NewsCategory } from "@/types";
import { lookupBias } from "./bias-lookup";
import { getBiasDirection, extractDomain, generateArticleId } from "./utils";
import { categories } from "./categories";
import { fetchRSSFeeds } from "./rss-fetcher";

function normalizeDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  let cleaned = raw.trim();
  const spaceDate = cleaned.match(
    /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})\s?([+-]\d{4})?$/
  );
  if (spaceDate) {
    const tz = spaceDate[3]
      ? `${spaceDate[3].slice(0, 3)}:${spaceDate[3].slice(3)}`
      : "Z";
    cleaned = `${spaceDate[1]}T${spaceDate[2]}${tz}`;
  }
  const parsed = new Date(cleaned);
  if (isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

interface CacheEntry {
  data: EnrichedArticle[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min — RSS has no rate limits

const apiCallTracker: Record<string, { count: number; resetAt: number }> = {
  rss: { count: 0, resetAt: 0 },
  currents: { count: 0, resetAt: 0 },
  thenewsapi: { count: 0, resetAt: 0 },
  newsapi: { count: 0, resetAt: 0 },
};

function trackApiCall(provider: string) {
  const tracker = apiCallTracker[provider];
  if (!tracker) return;
  const dayStart = new Date().setHours(0, 0, 0, 0);
  if (tracker.resetAt < dayStart) {
    tracker.count = 0;
    tracker.resetAt = dayStart;
  }
  tracker.count++;
  console.log(`[API] ${provider} call #${tracker.count}`);
}

function getCacheKey(category: NewsCategory, country: string): string {
  return `${category}:${country}`;
}

function enrichArticle(article: NewsArticle): EnrichedArticle {
  const domain = extractDomain(article.url);
  const biasData = lookupBias(article.url, article.source?.name);
  return {
    ...article,
    id: generateArticleId(article),
    sourceDomain: domain,
    bias: biasData?.bias ?? null,
    biasDirection: biasData ? getBiasDirection(biasData.bias) : null,
    reliability: biasData?.reliability ?? null,
  };
}

// ── Category mappings for APIs ──────────────────────────────────────────

const CURRENTS_CATEGORIES: Record<string, string> = {
  general: "general", politics: "politics", technology: "technology",
  business: "business", science: "science", health: "health",
  sports: "sports", entertainment: "entertainment",
};

const THENEWSAPI_CATEGORIES: Record<string, string> = {
  general: "general", politics: "politics", technology: "tech",
  business: "business", science: "science", health: "health",
  sports: "sports", entertainment: "entertainment",
};

// ── Provider: RSS Feeds (primary, unlimited) ────────────────────────────

async function fetchFromRSS(
  category: NewsCategory
): Promise<NewsArticle[] | null> {
  try {
    trackApiCall("rss");
    const articles = await fetchRSSFeeds(category);
    if (articles.length === 0) return null;
    return articles.map((a) => ({
      ...a,
      publishedAt: normalizeDate(a.publishedAt),
    }));
  } catch (err) {
    console.error("RSS fetch failed:", err);
    return null;
  }
}

// ── Provider: Currents API (supplementary) ──────────────────────────────

async function fetchFromCurrents(
  category: NewsCategory
): Promise<NewsArticle[] | null> {
  const apiKey = process.env.CURRENTS_API_KEY;
  if (!apiKey || apiKey.includes("your_")) return null;

  const cat = CURRENTS_CATEGORIES[category] || "general";
  const url = `https://api.currentsapi.services/v1/latest-news?language=en&category=${cat}&apiKey=${apiKey}`;

  try {
    trackApiCall("currents");
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.news || data.news.length === 0) return null;

    return data.news.map(
      (a: {
        title: string; description: string; url: string;
        image: string; published: string; author: string;
      }) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.image && a.image !== "None" ? a.image : null,
        publishedAt: normalizeDate(a.published),
        source: { id: null, name: extractSourceName(a.url) },
        author: a.author || null,
        content: null,
      })
    );
  } catch {
    return null;
  }
}

// ── Provider: TheNewsAPI (supplementary) ────────────────────────────────

async function fetchFromTheNewsAPI(
  category: NewsCategory
): Promise<NewsArticle[] | null> {
  const apiKey = process.env.THENEWSAPI_KEY;
  if (!apiKey || apiKey.includes("your_")) return null;

  const cat = THENEWSAPI_CATEGORIES[category] || "general";
  const url = `https://api.thenewsapi.com/v1/news/top?api_token=${apiKey}&locale=us&language=en&categories=${cat}&limit=3`;

  try {
    trackApiCall("thenewsapi");
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    return data.data.map(
      (a: {
        title: string; description: string; snippet: string;
        url: string; image_url: string; published_at: string; source: string;
      }) => ({
        title: a.title,
        description: a.description || a.snippet || null,
        url: a.url,
        urlToImage: a.image_url || null,
        publishedAt: normalizeDate(a.published_at),
        source: { id: null, name: formatSourceDomain(a.source) },
        author: null,
        content: a.snippet || null,
      })
    );
  } catch {
    return null;
  }
}

// ── Provider: NewsAPI.org (last resort) ─────────────────────────────────

async function fetchFromNewsAPI(
  category: NewsCategory,
  country: string
): Promise<NewsArticle[] | null> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey || apiKey.includes("your_")) return null;

  const catConfig = categories.find((c) => c.id === category);
  let url: string;
  if (catConfig?.query) {
    const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(catConfig.query)}&language=en&sortBy=publishedAt&from=${fromDate}&pageSize=40&apiKey=${apiKey}`;
  } else {
    const apiCategory = catConfig?.newsApiCategory || "general";
    url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${apiCategory}&pageSize=40&apiKey=${apiKey}`;
  }

  try {
    trackApiCall("newsapi");
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.articles || [];
  } catch {
    return null;
  }
}

// ── Main fetcher ────────────────────────────────────────────────────────

export async function fetchNews(
  category: NewsCategory = "general",
  country: string = "us"
): Promise<EnrichedArticle[]> {
  const cacheKey = getCacheKey(category, country);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const allArticles: NewsArticle[] = [];
  const seenUrls = new Set<string>();

  function addArticles(articles: NewsArticle[] | null) {
    if (!articles) return;
    for (const a of articles) {
      if (a.title && a.title !== "[Removed]" && a.url && !seenUrls.has(a.url)) {
        seenUrls.add(a.url);
        allArticles.push(a);
      }
    }
  }

  // 1. RSS feeds — primary, unlimited, real-time
  const rssArticles = await fetchFromRSS(category);
  addArticles(rssArticles);
  console.log(`[Feed] RSS returned ${rssArticles?.length || 0} articles for ${category}`);

  // 2. Supplement with APIs if RSS returned fewer than 10
  if (allArticles.length < 10) {
    const [currents, theNews] = await Promise.allSettled([
      fetchFromCurrents(category),
      fetchFromTheNewsAPI(category),
    ]);
    if (currents.status === "fulfilled") addArticles(currents.value);
    if (theNews.status === "fulfilled") addArticles(theNews.value);
  }

  // 3. Last resort: NewsAPI
  if (allArticles.length < 5) {
    const newsApi = await fetchFromNewsAPI(category, country);
    addArticles(newsApi);
  }

  if (allArticles.length === 0) {
    console.log("[Feed] All sources returned nothing, using mock data");
    return generateMockData(category);
  }

  const enriched = allArticles
    .map(enrichArticle)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  cache.set(cacheKey, { data: enriched, timestamp: Date.now() });
  return enriched;
}

export function getApiStatus() {
  return {
    rss: { ...apiCallTracker.rss },
    currents: { ...apiCallTracker.currents },
    thenewsapi: { ...apiCallTracker.thenewsapi },
    newsapi: { ...apiCallTracker.newsapi },
    cacheTTL: CACHE_TTL / 1000 / 60,
    cacheEntries: cache.size,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Unknown";
  }
}

function formatSourceDomain(domain: string): string {
  const cleaned = domain.replace(/^www\./, "");
  const name = cleaned.split(".")[0];
  const knownNames: Record<string, string> = {
    nytimes: "The New York Times", washingtonpost: "The Washington Post",
    foxnews: "Fox News", nbcnews: "NBC News", cbsnews: "CBS News",
    abcnews: "ABC News", cnn: "CNN", bbc: "BBC", reuters: "Reuters",
    apnews: "Associated Press", theguardian: "The Guardian",
    wsj: "Wall Street Journal", bloomberg: "Bloomberg", cnbc: "CNBC",
    nypost: "New York Post", usatoday: "USA Today", politico: "Politico",
    thehill: "The Hill", axios: "Axios", npr: "NPR", msnbc: "MSNBC",
    breitbart: "Breitbart", dailywire: "The Daily Wire", huffpost: "HuffPost",
    vox: "Vox", theatlantic: "The Atlantic", techcrunch: "TechCrunch",
    theverge: "The Verge", arstechnica: "Ars Technica", wired: "Wired",
    espn: "ESPN",
  };
  return knownNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

// ── Mock data (absolute last resort) ────────────────────────────────────

function generateMockData(category: NewsCategory): EnrichedArticle[] {
  const mockStories: Record<string, Array<{
    title: string; desc: string; source: string; url: string; img: string;
  }>> = {
    general: [
      { title: "Congress Reaches Bipartisan Agreement on Infrastructure Spending Bill", desc: "Lawmakers from both parties have come together to support a comprehensive infrastructure package.", source: "Reuters", url: "https://reuters.com/article1", img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600" },
      { title: "Federal Reserve Signals Interest Rate Decision Amid Economic Uncertainty", desc: "The Federal Reserve indicated it may hold steady on interest rates as it monitors inflation data.", source: "Bloomberg", url: "https://bloomberg.com/article1", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600" },
      { title: "Supreme Court to Hear Landmark Digital Privacy Case", desc: "The nation's highest court will decide whether law enforcement agencies need warrants to access citizens' digital communications.", source: "The New York Times", url: "https://nytimes.com/article1", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600" },
      { title: "White House Announces New Climate Initiative Partnership", desc: "The administration unveiled a public-private partnership aimed at accelerating clean energy adoption.", source: "NPR", url: "https://npr.org/article1", img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600" },
    ],
  };

  const stories = mockStories[category] || mockStories.general;
  const now = new Date();

  return stories.map((story, i) => {
    const publishedAt = new Date(now.getTime() - i * 45 * 60000).toISOString();
    const biasData = lookupBias(story.url, story.source);
    return {
      id: generateArticleId({ title: story.title, url: story.url }),
      title: story.title, description: story.desc, url: story.url,
      urlToImage: story.img, publishedAt,
      source: { id: null, name: story.source }, author: null, content: null,
      sourceDomain: extractDomain(story.url),
      bias: biasData?.bias ?? null,
      biasDirection: biasData ? getBiasDirection(biasData.bias) : null,
      reliability: biasData?.reliability ?? null,
    };
  });
}
