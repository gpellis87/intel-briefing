import { NextResponse } from "next/server";

interface MarketData {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: number[];
}

interface CacheEntry {
  data: MarketData[];
  timestamp: number;
}

const cacheByRange = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

const SYMBOLS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ" },
  { symbol: "^DJI", label: "DOW" },
  { symbol: "^RUT", label: "RUSSELL 2000" },
  { symbol: "GC=F", label: "GOLD" },
  { symbol: "CL=F", label: "OIL" },
  { symbol: "BTC-USD", label: "BTC" },
];

const ALLOWED_RANGES = new Set(["1d", "5d", "1mo"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedRange = searchParams.get("range") || "1d";
  const range = ALLOWED_RANGES.has(requestedRange) ? requestedRange : "1d";

  const cached = cacheByRange.get(range);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ markets: cached.data, range, updatedAt: cached.timestamp });
  }

  const results: MarketData[] = [];

  await Promise.allSettled(
    SYMBOLS.map(async ({ symbol, label }) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const data: any = await res.json();
        const result = data?.chart?.result?.[0];
        const meta = result?.meta;
        const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
          (value: number | null) => typeof value === "number" && Number.isFinite(value)
        ) as number[];
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!meta) return;

        const price = meta.regularMarketPrice || closes[closes.length - 1] || 0;
        const prevClose =
          meta.previousClose || meta.chartPreviousClose || closes[closes.length - 2] || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        results.push({
          symbol,
          label,
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          chartData: closes.slice(-30).map((value) => Math.round(value * 100) / 100),
        });
      } catch (err) {
        console.error(`Market fetch ${symbol}:`, err);
      }
    })
  );

  if (results.length > 0) {
    cacheByRange.set(range, { data: results, timestamp: Date.now() });
  }

  return NextResponse.json({ markets: results, range, updatedAt: Date.now() });
}
