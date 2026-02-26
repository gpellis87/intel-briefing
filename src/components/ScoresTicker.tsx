"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { GameScore } from "@/types/scores";
import { LEAGUES } from "@/types/scores";
import { ChevronLeft, ChevronRight } from "lucide-react";

function GameCard({ game }: { game: GameScore }) {
  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";
  const isRacing = game.league === "nascar" || game.league === "f1";

  if (isRacing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-tertiary/50 rounded-lg min-w-[140px]">
        <span className="text-[9px] font-bold text-text-muted uppercase">
          {game.league.toUpperCase()}
        </span>
        <span className="text-[11px] text-text-primary font-medium truncate max-w-[120px]">
          {game.eventName || game.detail}
        </span>
        {isLive && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface-tertiary/50 rounded-lg min-w-[160px]">
      {isLive && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-text-primary truncate">
            {game.awayTeam.abbr}
          </span>
          <span
            className={`text-[11px] font-bold tabular-nums ${
              !isFinal
                ? "text-text-primary"
                : game.awayTeam.score > game.homeTeam.score
                  ? "text-accent-cyan"
                  : "text-text-muted"
            }`}
          >
            {game.status === "scheduled" ? "" : game.awayTeam.score}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-text-primary truncate">
            {game.homeTeam.abbr}
          </span>
          <span
            className={`text-[11px] font-bold tabular-nums ${
              !isFinal
                ? "text-text-primary"
                : game.homeTeam.score > game.awayTeam.score
                  ? "text-accent-cyan"
                  : "text-text-muted"
            }`}
          >
            {game.status === "scheduled" ? "" : game.homeTeam.score}
          </span>
        </div>
      </div>
      <span
        className={`text-[9px] font-semibold whitespace-nowrap ${
          isLive ? "text-red-400" : isFinal ? "text-text-muted" : "text-text-secondary"
        }`}
      >
        {game.detail}
      </span>
    </div>
  );
}

export function ScoresTicker() {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [activeLeague, setActiveLeague] = useState("all");
  const [loaded, setLoaded] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/scores?league=all");
      const data = await res.json();
      setScores(data.scores || []);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  const filtered = useMemo(() => {
    if (activeLeague === "all") return scores;
    return scores.filter((s) => s.league === activeLeague);
  }, [scores, activeLeague]);

  const leaguesWithGames = useMemo(() => {
    const set = new Set(scores.map((s) => s.league));
    return LEAGUES.filter((l) => set.has(l.key));
  }, [scores]);

  if (!loaded || scores.length === 0) return null;

  return (
    <div className="bg-surface-secondary/50 border-b border-border-primary">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">
              Scores
            </span>
            <button
              onClick={() => setActiveLeague("all")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeLeague === "all"
                  ? "bg-accent-cyan/15 text-accent-cyan"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              All
            </button>
            {leaguesWithGames.map((l) => (
              <button
                key={l.key}
                onClick={() => setActiveLeague(l.key)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  activeLeague === l.key
                    ? "bg-accent-cyan/15 text-accent-cyan"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="h-4 border-l border-border-primary flex-shrink-0" />

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            {filtered.length === 0 && (
              <span className="text-[11px] text-text-muted">No games today</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
