# Intel Briefing - News Command Center

A sophisticated, dark-themed news aggregator that provides multi-perspective analysis with source bias indicators, reliability meters, and a prominent hero story for the top headline of the moment.

## Features

- **Command Center UI** - Dark, intelligence-briefing aesthetic with live ticker, category sectors, and status indicators
- **Hero Top Story** - The most recent article displayed prominently at the top of every feed
- **Bias Badges** - Color-coded indicators showing each source's political leaning (far-left through far-right)
- **Reliability Meter** - 0-100 trustworthiness score displayed on every article card
- **8 Categories** - Headlines, Politics, Tech, Business, Science, Health, Sports, Entertainment
- **150+ Sources Rated** - Static dataset of media bias and reliability ratings
- **Multi-API Cascade** - Three news providers for maximum freshness and reliability

## Getting Started

### Prerequisites

- Node.js 18+
- At least one free API key (see below)

### API Keys (all free)

| Provider | Freshness | Free Limit | Sign Up |
|----------|-----------|------------|---------|
| **Currents API** (primary) | Real-time | Free for dev | [currentsapi.services](https://currentsapi.services/en/register) |
| **TheNewsAPI** (secondary) | Real-time | 100 req/day, 3 per request | [thenewsapi.com](https://thenewsapi.com/register) |
| **NewsAPI.org** (fallback) | May be day-old | 100 req/day | [newsapi.org](https://newsapi.org/register) |

### Setup

```bash
cd intel-briefing
npm install
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```
CURRENTS_API_KEY=your_currents_key
THENEWSAPI_KEY=your_thenewsapi_key
NEWSAPI_KEY=your_newsapi_key
```

You only need one key to get started. The app tries providers in order and falls back gracefully. For the freshest news, get at least the Currents API key.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works with mock data if no API keys are configured.

### Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add your API keys as environment variables in project settings
4. Deploy

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **Currents API** + **TheNewsAPI** + **NewsAPI.org** for real-time news data

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── news/route.ts      # News API with multi-provider cascade
│   │   └── status/route.ts    # API usage monitoring
│   ├── layout.tsx             # Root layout with dark theme
│   ├── page.tsx               # Main dashboard
│   └── globals.css            # Custom theme and animations
├── components/
│   ├── ArticleCard.tsx        # Individual article display
│   ├── BiasBadge.tsx          # Political bias indicator
│   ├── CategoryNav.tsx        # Category tab navigation
│   ├── Dashboard.tsx          # Main dashboard orchestrator
│   ├── HeroArticle.tsx        # Featured top story component
│   ├── LoadingState.tsx       # Skeleton loading states
│   ├── ReliabilityMeter.tsx   # Source reliability gauge
│   ├── StatsBar.tsx           # Feed statistics display
│   └── TickerBar.tsx          # Scrolling headline ticker
├── data/
│   └── media-bias.json        # 150+ source bias/reliability ratings
├── lib/
│   ├── bias-lookup.ts         # Source bias data lookups
│   ├── categories.ts          # Category configuration
│   ├── news-fetcher.ts        # Multi-API news fetcher with caching
│   └── utils.ts               # Shared utilities
└── types/
    └── index.ts               # TypeScript type definitions
```

## API Usage & Monitoring

Hit `/api/status` to see a JSON summary of how many API calls each provider has used today and the cache state.

Articles are cached for 30 minutes. The cascade tries real-time providers first and only falls back to NewsAPI if the primary providers return fewer than 5 articles.
