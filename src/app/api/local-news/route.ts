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
      "Mozilla/5.0 (compatible; IntelBriefing/1.0; +https://intel-briefing.vercel.app)",
  },
});

interface CacheEntry {
  data: EnrichedArticle[];
  timestamp: number;
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
    });
  }

  try {
    const query = encodeURIComponent(`${city} ${state} local news`);
    const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const feed = await parser.parseURL(feedUrl);
    const articles: EnrichedArticle[] = [];

    for (const item of (feed.items || []).slice(0, 30)) {
      const title = item.title || "";
      const url = item.link || "";
      if (!title || !url) continue;

      const pubDate = item.isoDate || item.pubDate;
      if (!pubDate) continue;
      const d = new Date(pubDate);
      if (isNaN(d.getTime())) continue;
      if (Date.now() - d.getTime() > MAX_AGE_MS) continue;

      const sourceName = extractGoogleNewsSource(title);
      const domain = extractDomain(url);
      const biasData = lookupBias(domain) || lookupBias(sourceName);

      articles.push({
        id: generateArticleId({ title, url }),
        title: cleanGoogleNewsTitle(title),
        description: item.contentSnippet?.slice(0, 300) || null,
        url,
        urlToImage: null,
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

    articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    cache.set(cacheKey, { data: articles, timestamp: Date.now() });

    return NextResponse.json({
      articles,
      total: articles.length,
      category: "local",
      location: { city, state },
    });
  } catch (error) {
    console.error("Local news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch local news" },
      { status: 500 }
    );
  }
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
