# Intel Briefing - News Command Center

A sophisticated, multi-perspective news aggregator with built-in source bias analysis, reliability scoring, live sports scores, market data, weather, and a command-center aesthetic. Deployed on Vercel.

## Features

### Core News Engine
- **90+ RSS Feeds** (primary) from major news outlets across all categories, with 3 API fallbacks
- **Multi-API Cascade** -- RSS feeds first, then Currents API, TheNewsAPI, and NewsAPI.org as progressively deeper fallbacks
- **150+ Sources Rated** -- Static dataset (`media-bias.json`) with political bias (7-point scale) and reliability scores (0-100)
- **Bias Badges** -- Color-coded indicators on every article (far-left through far-right)
- **Reliability Meter** -- Visual 0-100 trustworthiness gauge per source
- **9 Categories** -- General, Politics, Tech, Business, Science, Health, Sports, Entertainment, Local
- **48-Hour Freshness** -- Automatic filtering rejects stale or future-dated articles

### Top Story & Breaking News
- **Hero Article** -- Most important non-sports story displayed prominently at the top
- **30-Minute Sticky Hero** -- Hero persists across refreshes; only overridden by stories with 3+ source clusters
- **Pin Button** -- Manually pin any story as the hero
- **Smart Breaking Badges** -- "BREAKING" requires 3+ sources covering same story within 2h; "JUST IN" for <30min; "NEW" for <2h

### Reading & Saving
- **Bookmarks** -- Save articles permanently to localStorage (up to 200); full article data stored so they never vanish
- **Reading History** -- Tracks every article you click with title, source, URL, and timestamp; slide-out history panel
- **Read Tracking** -- Articles you've opened are visually dimmed; toggle "Hide Read" to filter them out
- **Mark All Read** -- Bulk-mark all visible articles as read

### Discovery & Filtering
- **Search** -- Real-time full-text search across titles, sources, and descriptions
- **Bias Filter** -- Filter feed by Left, Center, or Right-leaning sources
- **Time Filter** -- Show articles from last 1h, today, 24h, or 48h
- **Source Directory** -- Browse all 150+ rated sources; exclude specific ones from your feed
- **Keyword Alerts** -- Set up to 20 keywords; matching articles get an amber highlight ring
- **Story Clustering** -- Group related articles using Jaccard similarity on title keywords
- **Trending Topics** -- Recency-weighted keyword extraction with article count badges

### Live Data Widgets
- **Sports Scores** -- Live scores from ESPN for NFL, NBA, MLB, NHL, MLS, NASCAR, and F1 (sports tab only, 2-min cache)
- **Market Ticker** -- S&P 500, NASDAQ, DOW, and BTC prices with change indicators (Yahoo Finance, 5-min cache)
- **Weather Widget** -- Current conditions with high/low and feels-like temp (OpenWeatherMap, 15-min cache)
- **Local News** -- Location-based news via browser geolocation or zip code; auto-falls back to nearest major city in your state

### UI & Personalization
- **5 Themes** -- System (auto), Midnight, Charcoal, Ocean, Light; persisted across visits
- **3 Density Modes** -- Compact, Comfortable, Spacious
- **3 View Modes** -- Grid, List, Compact
- **Glassmorphism Header** -- Frosted-glass sticky header with gradient accent border
- **Shimmer Skeletons** -- Modern loading animation (sweeping gradient instead of basic pulse)
- **Card Hover Lift** -- Cards elevate with shadow on hover
- **Image Fallbacks** -- Gradient placeholder with source initial when articles have no image
- **Scroll Progress Bar** -- Thin accent bar at top of viewport showing scroll position
- **Category Underline Animation** -- Clean animated underline on active category tab
- **Page Transitions** -- Smooth cross-fade when switching categories
- **Scrolling News Ticker** -- Live headline ticker bar
- **Back to Top** -- Floating button appears after scrolling

### Productivity
- **Daily Briefing** -- Full-screen summary of top stories from every category
- **Article Preview** -- Slide-out panel for quick article view without leaving the page
- **Keyboard Shortcuts** -- `j`/`k` navigate, `o`/`Enter` open, `s` bookmark, `/` search, `?` help
- **PWA Support** -- Installable as an app with offline caching via service worker
- **Reading Time Estimates** -- Based on word count (200 wpm)

### Analytics
- **Click Tracking** -- Tracks article clicks and saves via `/api/track` (in-memory fallback; optional Vercel KV for persistence)
- **Popular Articles** -- `/api/popular` returns today's most-clicked articles
- **Analytics Dashboard** -- `/analytics` page with stats cards, category popularity bars, and most-clicked rankings
- **Toolbar Overflow Menu** -- Secondary actions consolidated into a clean dropdown to keep the header minimal

## Getting Started

### Prerequisites

- Node.js 18+
- At least one free API key (or none -- RSS feeds work without any keys)

### API Keys (all free)

| Provider | Purpose | Free Limit | Sign Up |
|----------|---------|------------|---------|
| **Currents API** | News fallback | Free for dev | [currentsapi.services](https://currentsapi.services/en/register) |
| **TheNewsAPI** | News fallback | 100 req/day | [thenewsapi.com](https://thenewsapi.com/register) |
| **NewsAPI.org** | News fallback | 100 req/day | [newsapi.org](https://newsapi.org/register) |
| **OpenWeatherMap** | Weather widget | 1000 calls/day | [openweathermap.org](https://openweathermap.org/api) |

Sports scores (ESPN) and market data (Yahoo Finance) require no API keys.

### Setup

```bash
cd intel-briefing
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```
CURRENTS_API_KEY=your_currents_key
THENEWSAPI_KEY=your_thenewsapi_key
NEWSAPI_KEY=your_newsapi_key
OPENWEATHER_API_KEY=your_openweather_key
```

RSS feeds are the primary data source and require no keys. The API keys are optional fallbacks for additional coverage.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add environment variables in project Settings > Environment Variables
4. Deploy

**Optional for persistent analytics:** Run `vercel kv create intel-analytics` and add the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables.

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS v4** with CSS custom properties for theming
- **Lucide React** for icons
- **rss-parser** for RSS/Atom feed parsing
- **Vercel KV** (optional) for click analytics persistence

## Data Sources

- **RSS Feeds** (primary) -- 90+ feeds from outlets like AP, Reuters, BBC, CNN, Fox News, NPR, NYT, WSJ, etc. Configured in `src/data/rss-feeds.json`
- **Currents API** (secondary) -- Real-time news
- **TheNewsAPI** (tertiary) -- Real-time top stories
- **NewsAPI.org** (fallback) -- May return day-old articles on free tier
- **ESPN** -- Live sports scores (no key required)
- **Yahoo Finance** -- Market indices (no key required)
- **OpenWeatherMap** -- Weather data (free API key)
- **Google News RSS / Bing News RSS** -- Local news with major-city fallback
- **Media Bias Data** -- 150+ source ratings in `src/data/media-bias.json`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── local-news/route.ts   # Local news with city fallback
│   │   ├── markets/route.ts      # Yahoo Finance market data
│   │   ├── news/route.ts         # Main news API (RSS + API cascade)
│   │   ├── popular/route.ts      # Popular articles by clicks
│   │   ├── scores/route.ts       # ESPN live sports scores
│   │   ├── status/route.ts       # API usage monitoring
│   │   ├── track/route.ts        # Click/save tracking
│   │   └── weather/route.ts      # OpenWeatherMap weather
│   ├── analytics/page.tsx        # Analytics dashboard
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Main entry point
│   └── globals.css               # Themes, animations, utilities
├── components/                   # 36 React components
│   ├── Dashboard.tsx             # Main orchestrator
│   ├── HeroArticle.tsx           # Featured top story
│   ├── ArticleCard.tsx           # Grid article card
│   ├── ArticleListItem.tsx       # List/compact article row
│   ├── ArticlePreview.tsx        # Slide-out preview panel
│   ├── ScoresTicker.tsx          # Live sports scores bar
│   ├── MarketTicker.tsx          # Market indices bar
│   ├── WeatherWidget.tsx         # Header weather display
│   ├── TrendingTopics.tsx        # Recency-weighted trending
│   ├── ToolbarMenu.tsx           # Overflow menu dropdown
│   ├── ScrollProgress.tsx        # Scroll progress bar
│   └── ...                       # 25 more components
├── context/
│   ├── ThemeContext.tsx           # 5-theme system with OS detection
│   └── BookmarkContext.tsx        # Persistent bookmark storage
├── data/
│   ├── media-bias.json           # 150+ source bias/reliability
│   └── rss-feeds.json            # 90+ RSS feed URLs by category
├── hooks/
│   ├── useKeyboardNav.ts         # Keyboard navigation
│   ├── useKeywordAlerts.ts       # Custom keyword alerts
│   └── useReadTracker.ts         # Read history with metadata
├── lib/
│   ├── bias-lookup.ts            # Source bias lookups
│   ├── categories.ts             # Category configuration
│   ├── news-fetcher.ts           # Multi-API fetcher with caching
│   ├── rss-fetcher.ts            # RSS feed parser and validator
│   ├── story-clustering.ts       # Jaccard similarity clustering
│   └── utils.ts                  # Shared utilities
└── types/
    ├── index.ts                  # Core type definitions
    └── scores.ts                 # Sports scores types
```

## API Monitoring

Visit `/api/status` for a JSON summary of API call counts and cache state.

Articles are cached server-side for 15 minutes. The cascade tries RSS feeds first, then APIs in order, falling back gracefully if any provider is unavailable or rate-limited.
