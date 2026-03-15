/**
 * Backend API client.
 * - Dev: Vite proxies /api → http://localhost:3000 (see vite.config.ts).
 * - Production: Same origin; vercel.json sends /api to the serverless function.
 * - Optional: Set VITE_API_BASE in .env (e.g. https://your-api.vercel.app) to call another host.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export type Player = {
  id: string;
  name: string;
  rapid_api_id?: number | null;
  team_name?: string | null;
  position?: string | null;
  photo_url?: string | null;
};

export type PlayerStat = {
  season?: string | null;
  goals?: number | null;
  assists?: number | null;
  xg?: number | null;
  xa?: number | null;
  minutes_played?: number | null;
};

/** One row from external_stats (multiple data sources per PRD). */
export type ExternalStat = {
  id?: string;
  source: string;
  season?: string | null;
  payload: Record<string, unknown>;
};

/** Nielsen Fan Insights: engagement spikes and regional demographics (Digital Impact). */
export type DigitalImpact = {
  engagementSpikes: Array<Record<string, unknown>>;
  regionalDemographics: Array<Record<string, unknown>>;
  hypeScore: number | null;
  updatedAt?: string | null;
} | null;

/** AI Insight with bullets and full text */
export type Insight = {
  summary_text: string;
  bullets?: string[];
  full_text?: string;
} | null;

/** Single profile (GET /api/players/:id) */
export type ProfileResponse = {
  player: Player;
  stats: PlayerStat[] | null;
  externalStats: ExternalStat[] | null;
  insight: Insight;
  digitalImpact?: DigitalImpact;
};

/** Search returns multiple candidates (GET /api/players/search) */
export type SearchResponse = {
  candidates: Player[];
  suggestions?: string[];
};

export type CompareResponse = {
  player1: Player;
  player2: Player;
  stats1: PlayerStat[] | null;
  stats2: PlayerStat[] | null;
  deltas: {
    goals: number;
    assists: number;
    xg: number;
    xa: number;
    minutes_played: number;
  };
  narrative: string;
  verdict?: string;
  sustainability?: string;
  analysis?: string;
};

const FETCH_TIMEOUT_MS = 15000;

async function fetchJson<T>(
  url: string,
  options?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  let signal = options?.signal;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (!signal) {
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      signal,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError")
      throw new Error("Request took too long. Please try again.");
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export type RequestOptions = { signal?: AbortSignal };

export async function searchPlayers(
  q: string,
  options?: RequestOptions
): Promise<SearchResponse> {
  const encoded = encodeURIComponent(q.trim());
  if (!encoded) throw new Error("Search query is required");
  return fetchJson<SearchResponse>(`/api/players/search?q=${encoded}`, options);
}

export async function getPlayerProfile(
  id: string,
  options?: RequestOptions
): Promise<ProfileResponse> {
  return fetchJson<ProfileResponse>(
    `/api/players/${encodeURIComponent(id)}`,
    options
  );
}

export async function getCompare(
  p1Id: string,
  p2Id: string,
  options?: RequestOptions
): Promise<CompareResponse> {
  return fetchJson<CompareResponse>(
    `/api/compare?p1=${encodeURIComponent(p1Id)}&p2=${encodeURIComponent(p2Id)}`,
    options
  );
}

/** World Cup 2026 — standings, fixtures, teams (GET /api/world-cup/...) */
export type WorldCupStandingsResponse = { standings: unknown[]; last_updated?: string };
export type WorldCupFixturesResponse = { fixtures: unknown[]; last_updated?: string };
export type WorldCupTeamsResponse = { teams: unknown[]; last_updated?: string };

export async function getWorldCupStandings(
  league?: number,
  season?: number,
  options?: RequestOptions
): Promise<WorldCupStandingsResponse> {
  const p = new URLSearchParams();
  if (league != null) p.set("league", String(league));
  if (season != null) p.set("season", String(season));
  const q = p.toString();
  return fetchJson<WorldCupStandingsResponse>(
    `/api/world-cup/standings${q ? `?${q}` : ""}`,
    options
  );
}

export async function getWorldCupFixtures(
  league?: number,
  season?: number,
  next?: number,
  options?: RequestOptions
): Promise<WorldCupFixturesResponse> {
  const p = new URLSearchParams();
  if (league != null) p.set("league", String(league));
  if (season != null) p.set("season", String(season));
  if (next != null) p.set("next", String(next));
  const q = p.toString();
  return fetchJson<WorldCupFixturesResponse>(
    `/api/world-cup/fixtures${q ? `?${q}` : ""}`,
    options
  );
}

export async function getWorldCupTeams(
  league?: number,
  season?: number,
  options?: RequestOptions
): Promise<WorldCupTeamsResponse> {
  const p = new URLSearchParams();
  if (league != null) p.set("league", String(league));
  if (season != null) p.set("season", String(season));
  const q = p.toString();
  return fetchJson<WorldCupTeamsResponse>(
    `/api/world-cup/teams${q ? `?${q}` : ""}`,
    options
  );
}
