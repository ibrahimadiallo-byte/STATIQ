/**
 * RapidAPI (API-Football v3) pass-through with caching. Live data + stable ID plan.
 */

import axios from 'axios';
import { get, set, TTL } from './cache.js';

const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com';

function getKey() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error('RAPIDAPI_KEY is required');
  return key;
}

async function request(path, params = {}, cacheKey = null, ttlMs = null) {
  const key = getKey();
  if (cacheKey != null && ttlMs != null) {
    const cached = get(cacheKey, ttlMs);
    if (cached !== null) return cached;
  }
  const { data, status } = await axios.get(`${RAPIDAPI_BASE}${path}`, {
    params,
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
    validateStatus: (s) => s < 500,
  });
  if (status !== 200) {
    const msg = data?.errors?.length ? data.errors.join(', ') : `HTTP ${status}`;
    throw new Error(`RapidAPI: ${msg}`);
  }
  const result = data?.response ?? data;
  if (cacheKey != null && ttlMs != null) set(cacheKey, result);
  return result;
}

/**
 * GET /api/fixtures/live — live fixtures (cached 30–60 s).
 */
export async function getLiveFixtures() {
  return request(
    '/fixtures',
    { live: 'all' },
    'fixtures:live',
    TTL.LIVE_FIXTURES_MS
  );
}

/**
 * GET /api/fixtures/today — fixtures for today (cached 2 min).
 */
export async function getFixturesToday(date = null) {
  const d = date || new Date().toISOString().slice(0, 10);
  return request(
    '/fixtures',
    { date: d },
    `fixtures:today:${d}`,
    TTL.FIXTURES_TODAY_MS
  );
}

/**
 * GET /api/teams/:teamId — team info by RapidAPI team id (cached 30 min).
 */
export async function getTeam(teamId) {
  return request(
    '/teams',
    { id: teamId },
    `team:${teamId}`,
    TTL.TEAM_MS
  );
}

/**
 * GET /api/standings?league=...&season=... (cached 1–6 h).
 */
export async function getStandings(leagueId, season) {
  const league = leagueId || 39;
  const s = season || new Date().getFullYear();
  return request(
    '/standings',
    { league, season: s },
    `standings:${league}:${s}`,
    TTL.STANDINGS_MS
  );
}

/**
 * GET /api/players/:rapidId/stats?season=... — player stats by RapidAPI player id and season (cached 5–10 min).
 */
export async function getPlayerStatsByRapidId(rapidId, season) {
  const s = season || new Date().getFullYear();
  return request(
    '/players',
    { id: rapidId, season: s },
    `player:stats:${rapidId}:${s}`,
    TTL.PLAYER_STATS_MS
  );
}

// World Cup 2026 — PRD: national teams, group stage, fixtures. League id from env or default (1 = FIFA World Cup in API-Football).
const WORLD_CUP_LEAGUE_ID = parseInt(process.env.WORLD_CUP_LEAGUE_ID || '1', 10) || 1;
const WORLD_CUP_SEASON = parseInt(process.env.WORLD_CUP_SEASON || '2026', 10) || 2026;

/**
 * World Cup standings (groups). Cached like league standings.
 */
export async function getWorldCupStandings(leagueId = WORLD_CUP_LEAGUE_ID, season = WORLD_CUP_SEASON) {
  return request(
    '/standings',
    { league: leagueId, season },
    `worldcup:standings:${leagueId}:${season}`,
    TTL.STANDINGS_MS
  );
}

/**
 * World Cup fixtures for the competition. Optional: next=N for next N fixtures.
 */
export async function getWorldCupFixtures(leagueId = WORLD_CUP_LEAGUE_ID, season = WORLD_CUP_SEASON, next = null) {
  const params = { league: leagueId, season };
  if (next != null) params.next = next;
  const key = `worldcup:fixtures:${leagueId}:${season}:${next ?? 'all'}`;
  return request(
    '/fixtures',
    params,
    key,
    TTL.FIXTURES_TODAY_MS
  );
}

/**
 * Teams in the World Cup competition (national teams). From /teams?league=...&season=...
 */
export async function getWorldCupTeams(leagueId = WORLD_CUP_LEAGUE_ID, season = WORLD_CUP_SEASON) {
  return request(
    '/teams',
    { league: leagueId, season },
    `worldcup:teams:${leagueId}:${season}`,
    TTL.TEAM_MS
  );
}
