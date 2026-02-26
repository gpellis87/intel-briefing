import { NextResponse } from "next/server";

interface MarketData {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CacheEntry {
  data: MarketData[];
  timestamp: number;
}

let cached: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000;

const SYMBOLS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ" },
  { symbol: "^DJI", label: "DOW" },
  { symbol: "BTC-USD", label: "BTC" },
];

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ markets: cached.data });
  }

  const results: MarketData[] = [];

  await Promise.allSettled(
    SYMBOLS.map(async ({ symbol, label }) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const data: any = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!meta) return;

        const price = meta.regularMarketPrice || 0;
        const prevClose = meta.previousClose || meta.chartPreviousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        results.push({
          symbol,
          label,
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        });
      } catch (err) {
        console.error(`Market fetch ${symbol}:`, err);
      }
    })
  );

  if (results.length > 0) {
    cached = { data: results, timestamp: Date.now() };
  }

  return NextResponse.json({ markets: results });
}
