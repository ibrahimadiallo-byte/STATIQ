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

/** Single profile (GET /api/players/:id) */
export type ProfileResponse = {
  player: Player;
  stats: PlayerStat[] | null;
  insight: { summary_text: string } | null;
};

/** Search returns multiple candidates (GET /api/players/search) */
export type SearchResponse = {
  candidates: Player[];
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
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function searchPlayers(q: string): Promise<SearchResponse> {
  const encoded = encodeURIComponent(q.trim());
  if (!encoded) throw new Error("Search query is required");
  return fetchJson<SearchResponse>(`/api/players/search?q=${encoded}`);
}

export async function getPlayerProfile(id: string): Promise<ProfileResponse> {
  return fetchJson<ProfileResponse>(`/api/players/${encodeURIComponent(id)}`);
}

export async function getCompare(p1Id: string, p2Id: string): Promise<CompareResponse> {
  return fetchJson<CompareResponse>(
    `/api/compare?p1=${encodeURIComponent(p1Id)}&p2=${encodeURIComponent(p2Id)}`
  );
}
