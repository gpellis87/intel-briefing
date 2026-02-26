import Parser from "rss-parser";
import type { NewsArticle, NewsCategory } from "@/types";
import { generateArticleId } from "./utils";
import rssFeedsData from "@/data/rss-feeds.json";

interface FeedSource {
  name: string;
  url: string;
  domain: string;
}

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; IntelBriefing/1.0; +https://intel-briefing.vercel.app)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

const feedsByCategory = rssFeedsData as Record<string, FeedSource[]>;

function extractImage(item: Record<string, unknown>): string | null {
  if (item.enclosure && typeof item.enclosure === "object") {
    const enc = item.enclosure as Record<string, string>;
    if (enc.url && enc.type?.startsWith("image")) return enc.url;
  }
  if (item.mediaContent && typeof item.mediaContent === "object") {
    const mc = item.mediaContent as Record<string, string>;
    if (mc.$ && typeof mc.$ === "object") {
      return (mc.$ as Record<string, string>).url || null;
    }
    return mc.url || null;
  }
  if (item.mediaThumbnail && typeof item.mediaThumbnail === "object") {
    const mt = item.mediaThumbnail as Record<string, string>;
    if (mt.$ && typeof mt.$ === "object") {
      return (mt.$ as Record<string, string>).url || null;
    }
    return mt.url || null;
  }
  // Try to pull image from content HTML
  const content = (item.content || item["content:encoded"] || "") as string;
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];

  return null;
}

const SKIP_URL_PATTERNS = [
  /\/live-news\//i,
  /\/live-updates\//i,
  /\/live-blog\//i,
  /liveblog/i,
];

function shouldSkipUrl(url: string): boolean {
  return SKIP_URL_PATTERNS.some((p) => p.test(url));
}

function parseAndValidateDate(isoDate?: string, pubDate?: string): string | null {
  const raw = isoDate || pubDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now() + 60_000) return null;
  return d.toISOString();
}

async function fetchSingleFeed(
  source: FeedSource
): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    if (!feed.items || feed.items.length === 0) return [];

    const articles: NewsArticle[] = [];

    for (const item of feed.items.slice(0, 15)) {
      const title = item.title || "";
      const url = item.link || "";

      if (!title || !url) continue;
      if (shouldSkipUrl(url)) continue;

      const publishedAt = parseAndValidateDate(item.isoDate, item.pubDate);
      if (!publishedAt) continue;

      articles.push({
        id: generateArticleId({ title, url }),
        title,
        description:
          item.contentSnippet?.slice(0, 300) ||
          item.summary?.slice(0, 300) ||
          item.content?.replace(/<[^>]*>/g, "").slice(0, 300) ||
          null,
        url,
        urlToImage: extractImage(item as unknown as Record<string, unknown>) || null,
        publishedAt,
        source: { id: null, name: source.name },
        author: item.creator || (item as unknown as Record<string, string>).author || null,
        content: null,
      });
    }

    return articles;
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${source.name}: ${(err as Error).message}`);
    return [];
  }
}

const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

function isRecent(publishedAt: string): boolean {
  const pubDate = new Date(publishedAt);
  if (isNaN(pubDate.getTime())) return false;
  return Date.now() - pubDate.getTime() < MAX_AGE_MS;
}

export async function fetchRSSFeeds(
  category: NewsCategory
): Promise<NewsArticle[]> {
  const catKey = category as string;
  const sources = feedsByCategory[catKey] || feedsByCategory["general"];

  if (!sources || sources.length === 0) return [];

  const results = await Promise.allSettled(
    sources.map((source) => fetchSingleFeed(source))
  );

  const allArticles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        if (isRecent(article.publishedAt)) {
          allArticles.push(article);
        }
      }
    }
  }

  return allArticles;
}
