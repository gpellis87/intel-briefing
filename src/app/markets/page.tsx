"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, TrendingUp, TrendingDown } from "lucide-react";

interface MarketData {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: number[];
}

interface MarketsResponse {
  markets: MarketData[];
  range: string;
  updatedAt?: number;
}

function formatPrice(label: string, price: number) {
  if (label === "BTC") return `$${price.toLocaleString()}`;
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Sparkline({ points, positive, id }: { points: number[]; positive: boolean; id: string }) {
  const normalized = points.length > 1 ? points : [points[0] ?? 0, points[0] ?? 0];
  const min = Math.min(...normalized);
  const max = Math.max(...normalized);
  const range = max - min || 1;
  const width = 320;
  const height = 100;

  const path = normalized
    .map((value, index) => {
      const x = (index / (normalized.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `${path} ${width},${height} 0,${height}`;
  const stroke = positive ? "#22c55e" : "#ef4444";
  const gradientId = `spark-${id.replace(/[^a-zA-Z0-9-_]/g, "")}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline fill={`url(#${gradientId})`} points={areaPath} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={path}
      />
    </svg>
  );
}

export default function MarketsPage() {
  const [data, setData] = useState<MarketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMarkets = async () => {
      try {
        const res = await fetch("/api/markets?range=1mo");
        if (!res.ok) throw new Error("Unable to load market intelligence");
        const json = (await res.json()) as MarketsResponse;
        if (isMounted) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load market intelligence");
          setLoading(false);
        }
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const updatedAt = useMemo(() => {
    if (!data?.updatedAt) return "Unavailable";
    return new Date(data.updatedAt).toLocaleString();
  }, [data?.updatedAt]);

  return (
    <div className="min-h-screen bg-surface-primary">
      <header className="sticky top-0 z-40 bg-surface-primary/90 backdrop-blur-xl border-b border-border-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-muted hover:text-accent-cyan transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Activity size={20} className="text-accent-cyan" />
            <h1 className="text-lg font-bold font-[var(--font-family-mono)] text-text-primary tracking-wider uppercase">
              Markets
            </h1>
          </div>
          <div className="text-[11px] text-text-muted uppercase tracking-wider">
            Updated {updatedAt}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl border border-border-primary skeleton-shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.markets.map((market) => {
              const up = market.change >= 0;
              return (
                <article
                  key={market.symbol}
                  className="rounded-2xl border border-border-primary bg-surface-secondary/60 p-5 space-y-4 card-hover-lift"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {market.label}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">{market.symbol}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {up ? "+" : ""}
                      {market.changePercent}%
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-text-primary tabular-nums">
                    {formatPrice(market.label, market.price)}
                  </div>

                  <div className={`text-sm font-semibold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}
                    {market.change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <Sparkline points={market.chartData} positive={up} id={market.symbol} />
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
