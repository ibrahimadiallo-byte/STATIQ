/**
 * BSD Sports API Service - Free unlimited football data.
 * https://sports.bzzoiro.com/docs/
 * 
 * Features: 8,900+ players, 22 leagues, no rate limits.
 */

import axios from 'axios';

const BASE_URL = process.env.BSD_API_URL || 'https://sports.bzzoiro.com/api';
const TIMEOUT_MS = 15000;

let cachedPlayers = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getToken() {
  const token = process.env.BSD_API_TOKEN;
  return token && String(token).trim() ? token.trim() : null;
}

function getHeaders() {
  const token = getToken();
  if (!token) return null;
  return { Authorization: `Token ${token}` };
}

/**
 * Fetch all players from BSD API (paginated, ~8,900 players).
 * Results are cached for 10 minutes.
 */
export async function fetchAllPlayers() {
  const headers = getHeaders();
  if (!headers) return [];

  if (cachedPlayers && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPlayers;
  }

  const allPlayers = [];
  let nextUrl = `${BASE_URL}/players/`;

  try {
    while (nextUrl) {
      const { data } = await axios.get(nextUrl, { headers, timeout: TIMEOUT_MS });
      if (data.results && Array.isArray(data.results)) {
        allPlayers.push(...data.results);
      }
      nextUrl = data.next;
    }

    cachedPlayers = allPlayers;
    cacheTimestamp = Date.now();
    console.log(`[BSD] Cached ${allPlayers.length} players`);
    return allPlayers;
  } catch (err) {
    console.error('[BSD] Failed to fetch players:', err.message);
    return cachedPlayers || [];
  }
}

/**
 * Search players by name (searches cached player list).
 * @param {string} searchTerm - Name to search for
 * @returns {Promise<object[]>} Matching players
 */
export async function searchPlayers(searchTerm) {
  const term = String(searchTerm).trim().toLowerCase();
  if (!term) return [];

  const allPlayers = await fetchAllPlayers();
  
  return allPlayers.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const shortName = (p.short_name || '').toLowerCase();
    return name.includes(term) || shortName.includes(term);
  }).slice(0, 50);
}

/**
 * Get player by BSD internal ID.
 */
export async function getPlayerById(playerId) {
  const headers = getHeaders();
  if (!headers) return null;

  try {
    const { data } = await axios.get(`${BASE_URL}/players/${playerId}/`, {
      headers,
      timeout: TIMEOUT_MS,
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Get player statistics (per-match stats with xG, xA, etc.).
 * @param {number} playerId - BSD player ID
 */
export async function getPlayerStats(playerId) {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/player-stats/`, {
      params: { player: playerId },
      headers,
      timeout: TIMEOUT_MS,
    });
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Get all teams from BSD.
 */
export async function getTeams() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/teams/`, { headers, timeout: TIMEOUT_MS });
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Get all leagues from BSD.
 */
export async function getLeagues() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/leagues/`, { headers, timeout: TIMEOUT_MS });
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Get live scores.
 */
export async function getLiveScores() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/live/`, { headers, timeout: TIMEOUT_MS });
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Get upcoming events/fixtures.
 */
export async function getEvents(params = {}) {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/events/`, {
      params,
      headers,
      timeout: TIMEOUT_MS,
    });
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Get ML predictions for matches.
 */
export async function getPredictions() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/predictions/`, {
      params: { upcoming: true },
      headers,
      timeout: TIMEOUT_MS,
    });
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Get player photo URL.
 */
export function getPlayerPhotoUrl(apiId) {
  const token = getToken();
  if (!token || !apiId) return null;
  return `https://sports.bzzoiro.com/img/player/${apiId}/?token=${token}`;
}

/**
 * Get team logo URL.
 */
export function getTeamLogoUrl(apiId) {
  const token = getToken();
  if (!token || !apiId) return null;
  return `https://sports.bzzoiro.com/img/team/${apiId}/?token=${token}`;
}

/**
 * Normalize BSD player to our DB schema.
 */
export function normalizeBsdPlayer(player) {
  return {
    name: player.name || player.short_name,
    rapid_api_id: player.api_id,
    team_name: player.current_team?.name || null,
    position: normalizePosition(player.position),
    photo_url: getPlayerPhotoUrl(player.api_id),
  };
}

function normalizePosition(pos) {
  const map = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Attacker' };
  return map[pos] || pos || null;
}

/**
 * Check if BSD API is available.
 */
export function isAvailable() {
  return !!getToken();
}
