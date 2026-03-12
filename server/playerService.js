import { supabase } from './supabase.js';
import axios from 'axios';

const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com';

function getRapidKey() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error('RAPIDAPI_KEY is required for ingest');
  return key;
}

/**
 * Normalize one API-Football profile item to our player row shape.
 */
function normalizeApiPlayer(item, searchTerm) {
  const p = item.player || item;
  const stats = item.statistics?.[0];
  const teamName = stats?.team?.name ?? null;
  const position = stats?.games?.position ?? null;
  const photoUrl =
    p.photo ||
    (p.id ? `https://media.api-sports.io/football/players/${p.id}.png` : null);
  return {
    name: p.name || searchTerm,
    rapid_api_id: p.id ?? null,
    understat_id: null,
    team_name: teamName,
    position,
    photo_url: photoUrl || null,
  };
}

/**
 * Ensure player exists in DB by rapid_api_id; return our player row (insert or select).
 */
async function upsertPlayer(row) {
  if (row.rapid_api_id == null) {
    const { data: inserted, error } = await supabase
      .from('players')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(`Failed to save player: ${error.message}`);
    return inserted;
  }
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('rapid_api_id', row.rapid_api_id)
    .maybeSingle();
  if (existing) return existing;
  const { data: inserted, error } = await supabase
    .from('players')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Failed to save player: ${error.message}`);
  return inserted;
}

/**
 * Get player by our UUID (for profile).
 */
export async function getPlayerById(id) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

/**
 * Stable ID: exact lookup by rapid_api_id.
 * @returns {Promise<object | null>} Our player row or null
 */
export async function getPlayerByRapidId(rapidId) {
  const id = parseInt(rapidId, 10);
  if (Number.isNaN(id)) return null;
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('rapid_api_id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

/**
 * Search: return all candidates from API (and DB matches by name). Uses rapid_api_id for stable identity.
 * @param {string} searchTerm
 * @returns {Promise<{ candidates: object[] }>}
 */
async function fetchProfilesFromApi(apiKey, search) {
  const { data, status } = await axios.get(
    `${RAPIDAPI_BASE}/players/profiles`,
    {
      params: { search },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      validateStatus: (s) => s < 500,
    }
  );
  return status === 200 && data?.response?.length ? data.response : [];
}

export async function searchCandidates(searchTerm) {
  const trimmed = String(searchTerm).trim();
  if (!trimmed) return { candidates: [] };

  const key = getRapidKey();

  // 1. DB: any existing by name (case-insensitive) — return as candidates
  const { data: byName, error: selectError } = await supabase
    .from('players')
    .select('*')
    .ilike('name', `%${trimmed}%`)
    .limit(20);

  if (selectError) throw new Error(`Supabase lookup failed: ${selectError.message}`);
  const fromDb = byName || [];

  // 2. API: only call when 3+ chars (API requirement); otherwise we already have DB suggestions above
  let apiList = [];
  if (trimmed.length >= 3) {
    apiList = await fetchProfilesFromApi(key, trimmed);
    if (apiList.length === 0 && trimmed.includes(' ')) {
      const surname = trimmed.split(/\s+/).pop();
      if (surname.length >= 3) apiList = await fetchProfilesFromApi(key, surname);
    }
    if (apiList.length === 0 && trimmed.includes(' ')) {
      const firstName = trimmed.split(/\s+/)[0];
      if (firstName.length >= 3) apiList = await fetchProfilesFromApi(key, firstName);
    }
  }
  const seenRapidIds = new Set(fromDb.map((p) => p.rapid_api_id).filter(Boolean));

  for (const item of apiList) {
    const row = normalizeApiPlayer(item, trimmed);
    if (row.rapid_api_id != null && seenRapidIds.has(row.rapid_api_id)) continue;
    const player = await upsertPlayer(row);
    if (player) {
      fromDb.push(player);
      if (player.rapid_api_id != null) seenRapidIds.add(player.rapid_api_id);
    }
  }

  // Dedupe by id and sort by name
  const byId = new Map();
  for (const p of fromDb) byId.set(p.id, p);
  const candidates = Array.from(byId.values()).sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );

  return { candidates };
}

/**
 * Single-player search (legacy): first candidate or throw. Use searchCandidates for multi.
 * @returns {Promise<{ player: object, source: 'db' | 'api' }>}
 */
export async function searchOrIngestPlayer(searchTerm) {
  const { candidates } = await searchCandidates(searchTerm);
  if (!candidates.length) {
    throw new Error('Player not found in API');
  }
  return { player: candidates[0], source: 'db' };
}
