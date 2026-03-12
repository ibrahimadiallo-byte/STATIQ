import { supabase } from './supabase.js';
import axios from 'axios';

/**
 * Generic helpers for storing and reading external stats blobs.
 * This lets us satisfy the PRD's "multiple data sources" requirement
 * without locking into one upstream; each row records its source.
 */

export async function getExternalStatsForPlayer(playerId) {
  const { data, error } = await supabase
    .from('external_stats')
    .select('*')
    .eq('player_id', playerId)
    .order('season', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Supabase (external_stats): ${error.message}`);
  return data || [];
}

export async function upsertExternalStats(playerId, source, season, payload) {
  const { data, error } = await supabase
    .from('external_stats')
    .insert({ player_id: playerId, source, season, payload })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to save external stats: ${error.message}`);
  return data;
}

/**
 * Optional Understat integration hook.
 *
 * If you set UNDERSTAT_API_BASE to a proxy that returns JSON player-season stats
 * (keyed by the players.understat_id value), this function will fetch and store
 * them into external_stats as source='understat'.
 *
 * This keeps the code ready for real multi-source ingestion without requiring
 * scraping logic inside the Vercel app itself.
 */
export async function syncUnderstatStatsForPlayer(player) {
  const base = process.env.UNDERSTAT_API_BASE;
  if (!base) return null;
  if (!player?.understat_id) return null;

  const url = `${base.replace(/\/$/, '')}/player/${player.understat_id}`;
  const { data, status } = await axios.get(url, {
    validateStatus: (s) => s < 500,
    timeout: 10000,
  });

  if (status !== 200 || !data) return null;

  // Expect data to be an array of season objects; fall back to single object.
  const seasons = Array.isArray(data) ? data : [data];
  const saved = [];

  for (const seasonRow of seasons) {
    const season = seasonRow.season || seasonRow.year || null;
    const row = await upsertExternalStats(
      player.id,
      'understat',
      season,
      seasonRow
    );
    saved.push(row);
  }

  return saved;
}

