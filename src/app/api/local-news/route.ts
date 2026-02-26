import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import type { EnrichedArticle } from "@/types";
import { generateArticleId, extractDomain } from "@/lib/utils";
import { lookupBias } from "@/lib/bias-lookup";
import { getBiasDirection } from "@/lib/utils";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
});

interface CacheEntry {
  data: EnrichedArticle[];
  timestamp: number;
  feedSource: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");

  if (!city || !state) {
    return NextResponse.json(
      { error: "Missing city or state parameter" },
      { status: 400 }
    );
  }

  const cacheKey = `${city}-${state}`.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      articles: cached.data,
      total: cached.data.length,
      category: "local",
      location: { city, state },
      feedSource: cached.feedSource,
    });
  }

  const query = `${city} ${state}`;

  // Try Google News first, then Bing as fallback
  let articles = await tryGoogleNews(query);
  let feedSource = "google";

  if (articles.length === 0) {
    articles = await tryBingNews(query);
    feedSource = "bing";
  }

  if (articles.length === 0) {
    feedSource = "none";
  }

  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  cache.set(cacheKey, { data: articles, timestamp: Date.now(), feedSource });

  return NextResponse.json({
    articles,
    total: articles.length,
    category: "local",
    location: { city, state },
    feedSource,
  });
}

async function tryGoogleNews(query: string): Promise<EnrichedArticle[]> {
  try {
    const encoded = encodeURIComponent(`${query} local news`);
    const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(feedUrl);
    return parseFeedItems(feed.items || [], "google");
  } catch (err) {
    console.error("Google News RSS failed:", err);
    return [];
  }
}

async function tryBingNews(query: string): Promise<EnrichedArticle[]> {
  try {
    const encoded = encodeURIComponent(`${query} news`);
    const feedUrl = `https://www.bing.com/news/search?q=${encoded}&format=rss`;
    const feed = await parser.parseURL(feedUrl);
    return parseFeedItems(feed.items || [], "bing");
  } catch (err) {
    console.error("Bing News RSS failed:", err);
    return [];
  }
}

function parseFeedItems(
  items: Parser.Item[],
  source: string
): EnrichedArticle[] {
  const articles: EnrichedArticle[] = [];

  for (const item of items.slice(0, 30)) {
    const title = item.title || "";
    const url = item.link || "";
    if (!title || !url) continue;

    const pubDate = item.isoDate || item.pubDate;
    if (!pubDate) continue;
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) continue;
    if (Date.now() - d.getTime() > MAX_AGE_MS) continue;

    const sourceName =
      source === "google" ? extractGoogleNewsSource(title) : "";
    const cleanTitle =
      source === "google" ? cleanGoogleNewsTitle(title) : title;
    const domain = extractDomain(url);
    const biasData = lookupBias(domain) || lookupBias(sourceName);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const itemAny = item as any;
    const imageUrl: string | null =
      itemAny?.["media:content"]?.["$"]?.url ||
      itemAny?.enclosure?.url ||
      null;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    articles.push({
      id: generateArticleId({ title: cleanTitle, url }),
      title: cleanTitle,
      description: item.contentSnippet?.slice(0, 300) || null,
      url,
      urlToImage: imageUrl,
      publishedAt: d.toISOString(),
      source: { id: null, name: sourceName || domain || "Local" },
      author: null,
      content: null,
      bias: biasData?.bias || null,
      biasDirection: biasData ? getBiasDirection(biasData.bias) : null,
      reliability: biasData?.reliability || null,
      sourceDomain: domain,
    });
  }

  return articles;
}

function extractGoogleNewsSource(title: string): string {
  const dash = title.lastIndexOf(" - ");
  if (dash > 0) return title.slice(dash + 3).trim();
  return "";
}

function cleanGoogleNewsTitle(title: string): string {
  const dash = title.lastIndexOf(" - ");
  if (dash > 0) return title.slice(0, dash).trim();
  return title;
}
