import { NextRequest, NextResponse } from "next/server";
import { LEAGUES, type GameScore } from "@/types/scores";

interface CacheEntry {
  data: GameScore[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 2 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leagueParam = searchParams.get("league") || "all";

  const leaguesToFetch =
    leagueParam === "all"
      ? LEAGUES
      : LEAGUES.filter((l) => l.key === leagueParam);

  if (leaguesToFetch.length === 0) {
    return NextResponse.json({ error: "Invalid league" }, { status: 400 });
  }

  const allScores: GameScore[] = [];

  await Promise.allSettled(
    leaguesToFetch.map(async (league) => {
      const cached = cache.get(league.key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        allScores.push(...cached.data);
        return;
      }

      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.league}/scoreboard`;
        const res = await fetch(url, {
          headers: { "User-Agent": "IntelBriefing/1.0" },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return;

        const data = await res.json();
        const scores = parseESPNScoreboard(data, league.key);
        cache.set(league.key, { data: scores, timestamp: Date.now() });
        allScores.push(...scores);
      } catch (err) {
        console.error(`ESPN ${league.key} fetch failed:`, err);
      }
    })
  );

  return NextResponse.json({
    scores: allScores,
    total: allScores.length,
    leagues: leaguesToFetch.map((l) => l.key),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseESPNScoreboard(data: any, leagueKey: string): GameScore[] {
  const events = data?.events || [];
  const scores: GameScore[] = [];

  for (const event of events) {
    try {
      const competitions = event.competitions || [];
      const competition = competitions[0];

      if (!competition) {
        // Racing events don't have competitions in the same structure
        scores.push({
          id: event.id || String(Math.random()),
          league: leagueKey,
          homeTeam: {
            name: event.name || "",
            abbr: leagueKey.toUpperCase(),
            logo: "",
            score: 0,
          },
          awayTeam: { name: "", abbr: "", logo: "", score: 0 },
          status: parseStatus(event.status),
          detail: event.status?.type?.shortDetail || event.name || "",
          startTime: event.date || "",
          eventName: event.name,
        });
        continue;
      }

      const competitors = competition.competitors || [];
      const home = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
      const away = competitors.find((c: any) => c.homeAway === "away") || competitors[1];

      if (!home) continue;

      scores.push({
        id: event.id || competition.id || String(Math.random()),
        league: leagueKey,
        homeTeam: {
          name: home.team?.displayName || home.team?.name || "",
          abbr: home.team?.abbreviation || "",
          logo: home.team?.logo || "",
          score: parseInt(home.score || "0", 10),
        },
        awayTeam: away
          ? {
              name: away.team?.displayName || away.team?.name || "",
              abbr: away.team?.abbreviation || "",
              logo: away.team?.logo || "",
              score: parseInt(away.score || "0", 10),
            }
          : { name: "", abbr: "", logo: "", score: 0 },
        status: parseStatus(competition.status || event.status),
        detail:
          competition.status?.type?.shortDetail ||
          event.status?.type?.shortDetail ||
          "",
        startTime: event.date || competition.date || "",
        eventName: event.name,
      });
    } catch {
      continue;
    }
  }

  return scores;
}

function parseStatus(status: any): GameScore["status"] {
  const state = status?.type?.state;
  if (state === "in") return "in_progress";
  if (state === "post") return "final";
  if (state === "pre") return "scheduled";
  const completed = status?.type?.completed;
  if (completed) return "final";
  return "scheduled";
}
/* eslint-enable @typescript-eslint/no-explicit-any */
