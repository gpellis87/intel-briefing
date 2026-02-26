export interface TeamInfo {
  name: string;
  abbr: string;
  logo: string;
  score: number;
}

export interface GameScore {
  id: string;
  league: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: "scheduled" | "in_progress" | "final" | "postponed";
  detail: string;
  startTime: string;
  eventName?: string;
}

export interface LeagueConfig {
  key: string;
  label: string;
  sport: string;
  league: string;
}

export const LEAGUES: LeagueConfig[] = [
  { key: "nfl", label: "NFL", sport: "football", league: "nfl" },
  { key: "nba", label: "NBA", sport: "basketball", league: "nba" },
  { key: "mlb", label: "MLB", sport: "baseball", league: "mlb" },
  { key: "nhl", label: "NHL", sport: "hockey", league: "nhl" },
  { key: "mls", label: "MLS", sport: "soccer", league: "usa.1" },
  { key: "nascar", label: "NASCAR", sport: "racing", league: "nascar" },
  { key: "f1", label: "F1", sport: "racing", league: "f1" },
];
