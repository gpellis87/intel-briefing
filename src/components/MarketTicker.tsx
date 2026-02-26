"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface MarketData {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MarketTicker() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch("/api/markets");
      const data = await res.json();
      if (data.markets?.length > 0) setMarkets(data.markets);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  if (!loaded || markets.length === 0) return null;

  return (
    <div className="bg-surface-secondary/30 border-b border-border-primary">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="py-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 items-stretch">
            {markets.map((m) => {
              const up = m.change >= 0;
              return (
                <Link
                  key={m.symbol}
                  href="/markets"
                  className="rounded-xl border border-border-primary bg-surface-primary/40 hover:bg-surface-hover transition-colors px-3 py-2 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                    {m.label}
                  </span>
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {m.label === "BTC"
                      ? `$${m.price.toLocaleString()}`
                      : m.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <div className={`flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    <span className="text-[11px] font-semibold tabular-nums">
                      {up ? "+" : ""}{m.changePercent}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
