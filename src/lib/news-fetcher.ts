import type { NewsArticle, EnrichedArticle, NewsCategory } from "@/types";
import { lookupBias } from "./bias-lookup";
import { getBiasDirection, extractDomain, generateArticleId } from "./utils";
import { categories } from "./categories";

function normalizeDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  // Currents API uses "2026-02-25 12:30:00 +0000" — replace space before time with T
  let cleaned = raw.trim();
  // Handle "YYYY-MM-DD HH:MM:SS +ZZZZ" format
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
const CACHE_TTL = 30 * 60 * 1000;

const apiCallTracker: Record<string, { count: number; resetAt: number }> = {
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
  console.log(`[API] ${provider} call #${tracker.count} today`);
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

// ── Category mappings per API ───────────────────────────────────────────

const CURRENTS_CATEGORIES: Record<string, string> = {
  general: "general",
  politics: "politics",
  technology: "technology",
  business: "business",
  science: "science",
  health: "health",
  sports: "sports",
  entertainment: "entertainment",
};

const THENEWSAPI_CATEGORIES: Record<string, string> = {
  general: "general",
  politics: "politics",
  technology: "tech",
  business: "business",
  science: "science",
  health: "health",
  sports: "sports",
  entertainment: "entertainment",
};

// ── Provider 1: Currents API (real-time) ────────────────────────────────

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
    if (!res.ok) {
      console.error(`Currents API error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data.news || data.news.length === 0) return null;

    return data.news.map(
      (a: {
        title: string;
        description: string;
        url: string;
        image: string;
        published: string;
        author: string;
        category: string[];
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
  } catch (err) {
    console.error("Currents API failed:", err);
    return null;
  }
}

// ── Provider 2: TheNewsAPI (real-time top stories) ──────────────────────

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
    if (!res.ok) {
      console.error(`TheNewsAPI error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    return data.data.map(
      (a: {
        title: string;
        description: string;
        snippet: string;
        url: string;
        image_url: string;
        published_at: string;
        source: string;
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
  } catch (err) {
    console.error("TheNewsAPI failed:", err);
    return null;
  }
}

// ── Provider 3: NewsAPI.org (fallback, may be stale) ────────────────────

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
      .toISOString()
      .split("T")[0];
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(catConfig.query)}&language=en&sortBy=publishedAt&from=${fromDate}&pageSize=40&apiKey=${apiKey}`;
  } else {
    const apiCategory = catConfig?.newsApiCategory || "general";
    url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${apiCategory}&pageSize=40&apiKey=${apiKey}`;
  }

  try {
    trackApiCall("newsapi");
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.error(`NewsAPI error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.articles || [];
  } catch (err) {
    console.error("NewsAPI failed:", err);
    return null;
  }
}

// ── Main fetcher with cascading fallback ────────────────────────────────

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
      if (a.title && a.title !== "[Removed]" && !seenUrls.has(a.url)) {
        seenUrls.add(a.url);
        allArticles.push(a);
      }
    }
  }

  // Try providers in order — combine results from all that succeed
  const currentsArticles = await fetchFromCurrents(category);
  addArticles(currentsArticles);

  const theNewsApiArticles = await fetchFromTheNewsAPI(category);
  addArticles(theNewsApiArticles);

  // Only fall back to NewsAPI if the real-time providers returned very little
  if (allArticles.length < 5) {
    console.log(
      `[API] Real-time providers returned ${allArticles.length} articles, supplementing with NewsAPI`
    );
    const newsApiArticles = await fetchFromNewsAPI(category, country);
    addArticles(newsApiArticles);
  }

  if (allArticles.length === 0) {
    console.log("[API] All providers returned nothing, using mock data");
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
  const parts = cleaned.split(".");
  const name = parts[0];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const knownNames: Record<string, string> = {
    nytimes: "The New York Times",
    washingtonpost: "The Washington Post",
    foxnews: "Fox News",
    nbcnews: "NBC News",
    cbsnews: "CBS News",
    abcnews: "ABC News",
    cnn: "CNN",
    bbc: "BBC",
    reuters: "Reuters",
    apnews: "Associated Press",
    theguardian: "The Guardian",
    wsj: "Wall Street Journal",
    bloomberg: "Bloomberg",
    cnbc: "CNBC",
    nypost: "New York Post",
    usatoday: "USA Today",
    politico: "Politico",
    thehill: "The Hill",
    axios: "Axios",
    npr: "NPR",
    msnbc: "MSNBC",
    breitbart: "Breitbart",
    dailywire: "The Daily Wire",
    huffpost: "HuffPost",
    vox: "Vox",
    theatlantic: "The Atlantic",
    techcrunch: "TechCrunch",
    theverge: "The Verge",
    arstechnica: "Ars Technica",
    wired: "Wired",
    espn: "ESPN",
    usmagazine: "US Magazine",
  };
  return knownNames[name] || capitalized;
}

// ── Mock data (last resort) ─────────────────────────────────────────────

function generateMockData(category: NewsCategory): EnrichedArticle[] {
  const mockStories: Record<
    string,
    Array<{
      title: string;
      desc: string;
      source: string;
      url: string;
      img: string;
    }>
  > = {
    general: [
      { title: "Congress Reaches Bipartisan Agreement on Infrastructure Spending Bill", desc: "Lawmakers from both parties have come together to support a comprehensive infrastructure package that addresses roads, bridges, and broadband access across the nation.", source: "Reuters", url: "https://reuters.com/article1", img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600" },
      { title: "Federal Reserve Signals Interest Rate Decision Amid Economic Uncertainty", desc: "The Federal Reserve indicated it may hold steady on interest rates as it monitors inflation data and global economic conditions heading into the next quarter.", source: "Bloomberg", url: "https://bloomberg.com/article1", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600" },
      { title: "Supreme Court to Hear Landmark Digital Privacy Case", desc: "The nation's highest court will decide whether law enforcement agencies need warrants to access citizens' digital communications and location data.", source: "The New York Times", url: "https://nytimes.com/article1", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600" },
      { title: "White House Announces New Climate Initiative Partnership", desc: "The administration unveiled a public-private partnership aimed at accelerating clean energy adoption across industrial sectors.", source: "NPR", url: "https://npr.org/article1", img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600" },
      { title: "Critics Question Government Spending Priorities in New Budget Proposal", desc: "Conservative lawmakers argue the latest budget proposal doesn't adequately address the national debt while expanding social programs.", source: "Fox News", url: "https://foxnews.com/article1", img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600" },
      { title: "Tech Giants Face New Regulatory Framework in Senate Committee", desc: "A bipartisan group of senators introduced legislation that would impose new transparency requirements on major technology platforms.", source: "The Wall Street Journal", url: "https://wsj.com/article1", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600" },
      { title: "Global Markets Rally on Trade Agreement Optimism", desc: "Stock markets around the world surged as negotiators from major economies signaled progress on reducing trade barriers and tariffs.", source: "CNBC", url: "https://cnbc.com/article1", img: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600" },
      { title: "Immigration Reform Debate Intensifies as Border Numbers Rise", desc: "New data showing increased migration has reignited the political debate over comprehensive immigration reform and border security measures.", source: "CNN", url: "https://cnn.com/article1", img: "https://images.unsplash.com/photo-1532375810709-75b1da00a4b0?w=600" },
    ],
    politics: [
      { title: "Progressive Caucus Pushes for Expanded Social Safety Net Programs", desc: "Progressive lawmakers are championing legislation that would significantly expand healthcare, childcare, and housing assistance programs.", source: "MSNBC", url: "https://msnbc.com/politics1", img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600" },
      { title: "Conservative Think Tanks Propose Alternative Economic Growth Strategy", desc: "Leading conservative policy organizations outlined a plan focused on tax cuts, deregulation, and domestic energy production to boost growth.", source: "National Review", url: "https://nationalreview.com/politics1", img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600" },
      { title: "Swing State Voters Express Frustration with Both Parties", desc: "Polling from key battleground states reveals growing dissatisfaction with partisan gridlock and a desire for practical solutions.", source: "The Hill", url: "https://thehill.com/politics1", img: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600" },
      { title: "Senate Filibuster Debate Reignites as Key Legislation Stalls", desc: "Calls to reform or eliminate the filibuster have grown louder as major bills continue to fail to reach the 60-vote threshold needed for passage.", source: "The Washington Post", url: "https://washingtonpost.com/politics1", img: "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=600" },
    ],
    technology: [
      { title: "AI Regulation Framework Takes Shape in Congressional Hearings", desc: "Lawmakers are exploring guardrails for artificial intelligence development, balancing innovation with concerns about job displacement and privacy.", source: "TechCrunch", url: "https://techcrunch.com/tech1", img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600" },
      { title: "Major Cloud Provider Announces Breakthrough in Quantum Computing", desc: "A leading tech company demonstrated a quantum processor that achieved computational tasks previously thought to be years away.", source: "Ars Technica", url: "https://arstechnica.com/tech1", img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600" },
      { title: "Cybersecurity Firms Warn of Sophisticated New Ransomware Campaigns", desc: "Security researchers have identified a new wave of ransomware attacks targeting critical infrastructure and healthcare systems.", source: "Wired", url: "https://wired.com/tech1", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600" },
      { title: "Electric Vehicle Adoption Accelerates as Charging Infrastructure Expands", desc: "New data shows EV sales have doubled year-over-year, driven by expanding charging networks and competitive pricing from new entrants.", source: "The Verge", url: "https://theverge.com/tech1", img: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600" },
    ],
    business: [
      { title: "Wall Street Banks Report Strong Quarterly Earnings Despite Rate Uncertainty", desc: "Major financial institutions beat earnings expectations, driven by robust trading revenue and growing wealth management divisions.", source: "CNBC", url: "https://cnbc.com/biz1", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600" },
      { title: "Retail Sector Adapts to Shifting Consumer Spending Patterns", desc: "Major retailers are restructuring operations as consumers increasingly prioritize experiences and services over traditional goods.", source: "Forbes", url: "https://forbes.com/biz1", img: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600" },
      { title: "Housing Market Shows Signs of Stabilization After Volatile Year", desc: "Home prices have leveled off in major markets as mortgage rates plateau and inventory slowly increases, giving buyers more options.", source: "The Wall Street Journal", url: "https://wsj.com/biz1", img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600" },
      { title: "Supply Chain Innovation Drives Down Logistics Costs for Manufacturers", desc: "Companies investing in AI-powered supply chain management are seeing significant cost reductions and improved delivery times.", source: "Bloomberg", url: "https://bloomberg.com/biz1", img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600" },
    ],
    science: [
      { title: "NASA Announces Discovery of Potentially Habitable Exoplanet", desc: "The James Webb Space Telescope has identified an Earth-sized planet with atmospheric conditions that could support liquid water.", source: "Nature", url: "https://nature.com/sci1", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600" },
      { title: "Breakthrough Gene Therapy Shows Promise for Rare Genetic Disorders", desc: "Clinical trials demonstrate that a new CRISPR-based treatment can effectively correct genetic mutations responsible for several inherited conditions.", source: "Science Magazine", url: "https://science.org/sci1", img: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600" },
      { title: "Fusion Energy Milestone Brings Commercial Power Plants Closer to Reality", desc: "Researchers achieved sustained fusion reactions lasting over 30 minutes, a critical step toward practical fusion energy production.", source: "MIT Technology Review", url: "https://technologyreview.com/sci1", img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600" },
    ],
    health: [
      { title: "New Study Links Ultra-Processed Foods to Increased Health Risks", desc: "Researchers found that diets high in ultra-processed foods are associated with higher rates of cardiovascular disease and certain cancers.", source: "The New York Times", url: "https://nytimes.com/health1", img: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600" },
      { title: "Mental Health Crisis Among Young Adults Prompts Policy Responses", desc: "Rising rates of anxiety and depression among 18-25 year olds have led to new federal funding for campus mental health services.", source: "NPR", url: "https://npr.org/health1", img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600" },
      { title: "Vaccine Development Platform Could Revolutionize Pandemic Preparedness", desc: "A new mRNA platform technology enables rapid development of vaccines for emerging pathogens, potentially cutting development time in half.", source: "Reuters", url: "https://reuters.com/health1", img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600" },
    ],
    sports: [
      { title: "NBA Playoffs Deliver Record-Breaking Television Ratings", desc: "This year's playoff matchups have drawn the highest viewership in a decade, fueled by competitive series and emerging star players.", source: "ESPN", url: "https://espn.com/sports1", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600" },
      { title: "Olympic Committee Announces Host City for 2036 Summer Games", desc: "The International Olympic Committee selected the host for the 2036 games, citing the city's existing infrastructure and sustainability plans.", source: "Sports Illustrated", url: "https://si.com/sports1", img: "https://images.unsplash.com/photo-1461896836934-bd45ba3c7921?w=600" },
      { title: "Formula 1 Revenue Hits All-Time High as US Fanbase Explodes", desc: "The racing series reported record revenue driven by the continued expansion of its American audience and new race venues.", source: "The Athletic", url: "https://theathletic.com/sports1", img: "https://images.unsplash.com/photo-1541889413-2d78090a5fee?w=600" },
    ],
    entertainment: [
      { title: "Streaming Wars Intensify as Platforms Compete for Original Content", desc: "Major streaming services are investing billions in exclusive content as subscriber growth slows and competition for viewer attention increases.", source: "Variety", url: "https://variety.com/ent1", img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600" },
      { title: "Box Office Surges with Summer Blockbuster Season", desc: "Theater attendance has rebounded strongly with several franchise films exceeding pre-pandemic opening weekend records.", source: "Hollywood Reporter", url: "https://hollywoodreporter.com/ent1", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600" },
      { title: "Gaming Industry Embraces AI-Generated Content Despite Creator Concerns", desc: "Game developers are increasingly using AI tools for content creation, sparking debate about artistic integrity and employment impacts.", source: "The Verge", url: "https://theverge.com/ent1", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600" },
    ],
  };

  const stories = mockStories[category] || mockStories.general;
  const now = new Date();

  return stories.map((story, i) => {
    const publishedAt = new Date(
      now.getTime() - i * 45 * 60000
    ).toISOString();
    const biasData = lookupBias(story.url, story.source);

    return {
      id: generateArticleId({ title: story.title, url: story.url }),
      title: story.title,
      description: story.desc,
      url: story.url,
      urlToImage: story.img,
      publishedAt,
      source: { id: null, name: story.source },
      author: null,
      content: null,
      sourceDomain: extractDomain(story.url),
      bias: biasData?.bias ?? null,
      biasDirection: biasData ? getBiasDirection(biasData.bias) : null,
      reliability: biasData?.reliability ?? null,
    };
  });
}
