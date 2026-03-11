import { supabase } from './supabase.js';
import axios from 'axios';

const UNDERSTAT_PLAYER_URL = 'https://understat.com/player';

/**
 * Get our player row by Understat ID so we can map to player_id (UUID).
 * @param {string} understatId - Understat player ID (e.g. "2371")
 * @returns {Promise<{ id: string, understat_id: string, ... } | null>}
 */
export async function getPlayerByUnderstatId(understatId) {
  const id = String(understatId).trim();
  if (!id) return null;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('understat_id', id)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase lookup failed: ${error.message}`);
  return data;
}

/**
 * Fetch season stats (xG, xA, etc.) from Understat player page.
 * Understat embeds data in the page; we parse it. Seasons are like "2023" or "2024".
 * @param {string} understatId - Understat player ID
 * @param {string} [season] - Optional season year (e.g. "2024")
 * @returns {Promise<{ xg: number, xa: number, goals?: number, assists?: number, time?: number }[] | null>}
 */
export async function fetchUnderstatPlayerStats(understatId, season) {
  const id = String(understatId).trim();
  if (!id) return null;

  try {
    const { data: html } = await axios.get(`${UNDERSTAT_PLAYER_URL}/${id}`, {
      headers: { 'User-Agent': 'STATIQ/1.0 (Sports Analytics)' },
      timeout: 10000,
      validateStatus: (s) => s === 200,
    });

    if (!html || typeof html !== 'string') return null;

    // Understat embeds stats in a script: var playersData = [...]
    const match = html.match(/var\s+playersData\s*=\s*JSON\.parse\s*\(\s*'([^']+)'\s*\)/);
    if (!match) return null;

    const decoded = match[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    const rows = JSON.parse(decoded);
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const parsed = rows.map((r) => ({
      season: r.season,
      xg: parseFloat(r.xG) || 0,
      xa: parseFloat(r.xA) || 0,
      goals: parseInt(r.goals, 10) || 0,
      assists: parseInt(r.assists, 10) || 0,
      time: parseInt(r.time, 10) || 0,
    }));

    if (season) {
      const forSeason = parsed.filter((r) => r.season === season);
      return forSeason.length ? forSeason : null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Update player_stats with xG, xA (and optional goals, assists, minutes) from Understat.
 * Maps by understat_id to our player_id, then upserts one row per season.
 * @param {string} understatId - Understat player ID (must exist in players.understat_id)
 * @param {string} season - Season (e.g. "2024")
 * @param {{ xg?: number, xa?: number, goals?: number, assists?: number, minutes_played?: number }} stats
 * @returns {Promise<{ player_id: string, season: string, row: object }>}
 */
export async function updatePlayerStatsFromUnderstat(understatId, season, stats) {
  const player = await getPlayerByUnderstatId(understatId);
  if (!player) {
    throw new Error(`No player found with understat_id=${understatId}. Set players.understat_id first.`);
  }

  const playerId = player.id;
  const seasonStr = String(season).trim();
  const xg = stats.xg != null ? Number(stats.xg) : null;
  const xa = stats.xa != null ? Number(stats.xa) : null;
  const goals = stats.goals != null ? parseInt(stats.goals, 10) : 0;
  const assists = stats.assists != null ? parseInt(stats.assists, 10) : 0;
  const minutes_played = stats.minutes_played != null ? parseInt(stats.minutes_played, 10) : null;

  const { data: existing } = await supabase
    .from('player_stats')
    .select('id')
    .eq('player_id', playerId)
    .eq('season', seasonStr)
    .limit(1)
    .maybeSingle();

  const row = {
    player_id: playerId,
    season: seasonStr,
    goals,
    assists,
    xg,
    xa,
    minutes_played,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('player_stats')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update player_stats: ${error.message}`);
    return { player_id: playerId, season: seasonStr, row: updated };
  }

  const { data: inserted, error } = await supabase
    .from('player_stats')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert player_stats: ${error.message}`);
  return { player_id: playerId, season: seasonStr, row: inserted };
}

/**
 * Fetch Understat stats for a player and persist to player_stats. Maps by understat_id -> player_id.
 * @param {string} understatId - Understat player ID
 * @param {string} [season] - Optional season (e.g. "2024"); if omitted, all seasons returned by Understat are upserted
 * @returns {Promise<{ updated: { player_id: string, season: string, row: object }[] }>}
 */
export async function syncUnderstatStatsToDb(understatId, season) {
  const player = await getPlayerByUnderstatId(understatId);
  if (!player) {
    throw new Error(`No player found with understat_id=${understatId}. Set players.understat_id first.`);
  }

  const statsList = await fetchUnderstatPlayerStats(understatId, season);
  if (!statsList || statsList.length === 0) {
    return { updated: [] };
  }

  const updated = [];
  for (const s of statsList) {
    const result = await updatePlayerStatsFromUnderstat(understatId, s.season, {
      xg: s.xg,
      xa: s.xa,
      goals: s.goals,
      assists: s.assists,
      minutes_played: s.time,
    });
    updated.push(result);
  }
  return { updated };
}
