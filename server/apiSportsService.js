/**
 * API-Sports.io (Direct) — core data: profile, search, lineup.
 * Uses x-apisports-key header with API_SPORTS_KEY from env.
 * Base URL from API_SPORTS_URL (default: https://v3.football.api-sports.io).
 */

import axios from 'axios';

const DEFAULT_BASE = 'https://v3.football.api-sports.io';
const TIMEOUT_MS = 12000;

function getBaseUrl() {
  const url = process.env.API_SPORTS_URL;
  return url && String(url).trim() ? String(url).trim().replace(/\/$/, '') : DEFAULT_BASE;
}

function getKey() {
  const key = process.env.API_SPORTS_KEY;
  return key && String(key).trim() ? key : null;
}

function checkResponse(status, data, context) {
  if (status === 401 || status === 403) {
    throw new Error(`API_SPORTS_KEY invalid or quota exceeded (${context}).`);
  }
  if (status >= 400 && status < 500) {
    const msg = data?.errors?.length ? data.errors.join(', ') : `HTTP ${status}`;
    throw new Error(`API-Sports ${context}: ${msg}`);
  }
  if (status === 200 && Array.isArray(data?.errors) && data.errors.length > 0) {
    throw new Error(`API-Sports ${context}: ${data.errors.join(', ')}`);
  }
}

function unwrapResponse(data) {
  if (!data || typeof data !== 'object') return null;
  if (Array.isArray(data.response)) return data.response;
  return data.response ?? null;
}

/**
 * Top leagues for player search (API requires league + season with search).
 * Limited to 5 to leave room for national teams under rate limit.
 */
const SEARCH_LEAGUES = [
  39,   // Premier League (England)
  140,  // La Liga (Spain)
  135,  // Serie A (Italy)
  78,   // Bundesliga (Germany)
  61,   // Ligue 1 (France)
];

/**
 * Top national teams for World Cup 2026 player search.
 * These are searched via /players/squads (gets full roster, filtered locally).
 * Limited to 4 to stay under 10 req/min rate limit (5 leagues + 4 teams = 9).
 */
const NATIONAL_TEAMS = [
  2,    // France
  6,    // Brazil
  26,   // Argentina
  10,   // England
];

const CURRENT_SEASON = 2026;

/**
 * Search players by name across top 5 leagues (GET /players?search=&league=&season=).
 * API-Sports requires league+season when using search param.
 * @returns {Promise<object[]>} Array of API-Sports player objects (with player + statistics).
 */
export async function searchPlayers(search) {
  const key = getKey();
  if (!key) return [];

  const searchTerm = String(search).trim();
  const base = getBaseUrl();
  const headers = { 'x-apisports-key': key };

  const leagueRequests = SEARCH_LEAGUES.map((league) =>
    axios
      .get(`${base}/players`, {
        params: { search: searchTerm, league, season: CURRENT_SEASON },
        headers,
        timeout: TIMEOUT_MS,
        validateStatus: (s) => s < 500,
      })
      .then(({ data, status }) => {
        if (status === 200 && !data?.errors?.length) {
          return unwrapResponse(data) || [];
        }
        return [];
      })
      .catch(() => [])
  );

  const results = await Promise.all(leagueRequests);
  const combined = results.flat();

  const seen = new Set();
  return combined.filter((p) => {
    const id = p?.player?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Search national team squads for World Cup players.
 * @returns {Promise<object[]>} Array of player objects from national teams.
 */
export async function searchNationalTeamPlayers(search) {
  const key = getKey();
  if (!key) return [];

  const searchTerm = String(search).trim().toLowerCase();
  const base = getBaseUrl();
  const headers = { 'x-apisports-key': key };

  const teamRequests = NATIONAL_TEAMS.map((team) =>
    axios
      .get(`${base}/players/squads`, {
        params: { team },
        headers,
        timeout: TIMEOUT_MS,
        validateStatus: (s) => s < 500,
      })
      .then(({ data, status }) => {
        if (status === 200 && !data?.errors?.length) {
          const squads = unwrapResponse(data) || [];
          const players = squads[0]?.players || [];
          return players
            .filter((p) => p?.name?.toLowerCase().includes(searchTerm))
            .map((p) => ({
              player: { id: p.id, name: p.name, age: p.age, photo: p.photo },
              statistics: [{ team: squads[0]?.team, games: { position: p.position } }],
            }));
        }
        return [];
      })
      .catch(() => [])
  );

  const results = await Promise.all(teamRequests);
  const combined = results.flat();

  const seen = new Set();
  return combined.filter((p) => {
    const id = p?.player?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Get player profile + statistics by API-Sports player id (GET /players?id=).
 * @returns {Promise<object|null>} Single player object with player + statistics, or null.
 */
export async function getPlayerProfile(apiSportsId, season = null) {
  const key = getKey();
  if (!key) return null;

  const params = { id: apiSportsId };
  if (season) params.season = season;
  const { data, status } = await axios.get(`${getBaseUrl()}/players`, {
    params,
    headers: { 'x-apisports-key': key },
    timeout: TIMEOUT_MS,
    validateStatus: (s) => s < 500,
  });
  checkResponse(status, data, 'player');
  const list = unwrapResponse(data);
  if (Array.isArray(list) && list.length > 0) return list[0];
  return null;
}

/**
 * Get lineup for a fixture (GET /fixtures/lineups?fixture=).
 * @param {number} fixtureId - API-Sports fixture id
 * @returns {Promise<object[]>} Lineup entries (team, coach, startXI, substitutes).
 */
export async function getLineup(fixtureId) {
  const key = getKey();
  if (!key) return [];

  const { data, status } = await axios.get(`${getBaseUrl()}/fixtures/lineups`, {
    params: { fixture: fixtureId },
    headers: { 'x-apisports-key': key },
    timeout: TIMEOUT_MS,
    validateStatus: (s) => s < 500,
  });
  checkResponse(status, data, 'lineups');
  const list = unwrapResponse(data);
  return Array.isArray(list) ? list : [];
}

/**
 * Get player statistics for a season (GET /players?id=&season=).
 * @returns {Promise<object|null>} Player object with statistics array, or null.
 */
export async function getPlayerStats(apiSportsId, season) {
  return getPlayerProfile(apiSportsId, season);
}
