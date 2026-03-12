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
