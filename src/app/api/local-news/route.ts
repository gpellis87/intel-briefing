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
  fallbackCity?: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

const STATE_MAJOR_CITIES: Record<string, string[]> = {
  "Alabama": ["Birmingham", "Huntsville", "Montgomery"],
  "Alaska": ["Anchorage", "Fairbanks"],
  "Arizona": ["Phoenix", "Tucson", "Mesa"],
  "Arkansas": ["Little Rock", "Fayetteville"],
  "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento"],
  "Colorado": ["Denver", "Colorado Springs"],
  "Connecticut": ["Hartford", "New Haven", "Stamford"],
  "Delaware": ["Wilmington", "Dover"],
  "Florida": ["Miami", "Tampa", "Orlando", "Jacksonville"],
  "Georgia": ["Atlanta", "Savannah", "Augusta"],
  "Hawaii": ["Honolulu"],
  "Idaho": ["Boise"],
  "Illinois": ["Chicago", "Springfield", "Rockford"],
  "Indiana": ["Indianapolis", "Fort Wayne"],
  "Iowa": ["Des Moines", "Cedar Rapids"],
  "Kansas": ["Wichita", "Kansas City", "Topeka"],
  "Kentucky": ["Louisville", "Lexington"],
  "Louisiana": ["New Orleans", "Baton Rouge"],
  "Maine": ["Portland", "Bangor"],
  "Maryland": ["Baltimore", "Annapolis"],
  "Massachusetts": ["Boston", "Worcester", "Springfield"],
  "Michigan": ["Detroit", "Grand Rapids", "Ann Arbor"],
  "Minnesota": ["Minneapolis", "Saint Paul"],
  "Mississippi": ["Jackson", "Gulfport"],
  "Missouri": ["Kansas City", "St. Louis", "Springfield"],
  "Montana": ["Billings", "Missoula"],
  "Nebraska": ["Omaha", "Lincoln"],
  "Nevada": ["Las Vegas", "Reno"],
  "New Hampshire": ["Manchester", "Concord"],
  "New Jersey": ["Newark", "Jersey City", "Trenton"],
  "New Mexico": ["Albuquerque", "Santa Fe"],
  "New York": ["New York City", "Buffalo", "Albany"],
  "North Carolina": ["Charlotte", "Raleigh", "Durham"],
  "North Dakota": ["Fargo", "Bismarck"],
  "Ohio": ["Columbus", "Cleveland", "Cincinnati"],
  "Oklahoma": ["Oklahoma City", "Tulsa"],
  "Oregon": ["Portland", "Salem", "Eugene"],
  "Pennsylvania": ["Philadelphia", "Pittsburgh", "Harrisburg"],
  "Rhode Island": ["Providence"],
  "South Carolina": ["Charleston", "Columbia", "Greenville"],
  "South Dakota": ["Sioux Falls", "Rapid City"],
  "Tennessee": ["Nashville", "Memphis", "Knoxville"],
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
  "Utah": ["Salt Lake City", "Provo"],
  "Vermont": ["Burlington"],
  "Virginia": ["Richmond", "Virginia Beach", "Norfolk"],
  "Washington": ["Seattle", "Tacoma", "Spokane"],
  "West Virginia": ["Charleston", "Huntington"],
  "Wisconsin": ["Milwaukee", "Madison"],
  "Wyoming": ["Cheyenne", "Casper"],
  "District of Columbia": ["Washington"],
};

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
      fallbackCity: cached.fallbackCity,
    });
  }

  // Try the user's actual city first
  let articles = await tryFetchNews(`${city} ${state}`);
  let feedSource = "google";
  let fallbackCity: string | undefined;

  if (articles.length === 0) {
    feedSource = "bing";
  }

  // If no results, fall back to nearest major city in the same state
  if (articles.length === 0) {
    const majorCities = STATE_MAJOR_CITIES[state] || [];
    for (const majorCity of majorCities) {
      if (majorCity.toLowerCase() === city.toLowerCase()) continue;
      articles = await tryFetchNews(`${majorCity} ${state}`);
      if (articles.length > 0) {
        fallbackCity = majorCity;
        feedSource = "fallback";
        break;
      }
    }
  }

  if (articles.length === 0) {
    feedSource = "none";
  }

  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  cache.set(cacheKey, {
    data: articles,
    timestamp: Date.now(),
    feedSource,
    fallbackCity,
  });

  return NextResponse.json({
    articles,
    total: articles.length,
    category: "local",
    location: { city, state },
    feedSource,
    fallbackCity,
  });
}

async function tryFetchNews(query: string): Promise<EnrichedArticle[]> {
  let articles = await tryGoogleNews(query);
  if (articles.length === 0) {
    articles = await tryBingNews(query);
  }
  return articles;
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
