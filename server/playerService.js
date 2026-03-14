/**
 * STATIQ Multi-Source Aggregator (PRD: AI Narrative Workflow).
 *
 * Primary: BSD Sports API (free, unlimited) for 8,900+ players.
 * Fallback: api-sports.io (Direct) via API_SPORTS_KEY — profile, search, lineup.
 * Advanced Metrics: Understat (xG, xA, shot maps) via understatService / external_stats.
 * Market Value: Supabase/Transfermarkt dataset via marketValueService.
 *
 * Aggregates all sources into getAggregatedPlayerData() for generatePlayerReport (AI narrative).
 */

import { supabase } from './supabase.js';
import * as apiSports from './apiSportsService.js';
import * as bsd from './bsdService.js';
import { fetchUnderstatPlayerStats } from './understatService.js';
import { getExternalStatsForPlayer } from './externalStatsService.js';
import { getMarketValueForPlayer } from './marketValueService.js';

/** Normalize API-Sports player item to our DB row shape (player + statistics). */
function normalizeApiSportsPlayer(item, searchTerm) {
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

export async function getPlayerById(id) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

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
 * Multi-source aggregated data for one player (for AI narrative).
 * Core: api-sports.io profile + optional lineup.
 * Advanced: Understat xG/xA (and external_stats).
 * Market: Transfermarkt value + brand equity from Supabase.
 *
 * @param {string} playerId - Our player UUID
 * @returns {Promise<{ player: object, coreData: object|null, understatData: object|null, marketData: object|null }>}
 */
export async function getAggregatedPlayerData(playerId) {
  const player = await getPlayerById(playerId);
  if (!player) return null;

  let coreData = null;
  if (player.rapid_api_id) {
    try {
      coreData = await apiSports.getPlayerProfile(player.rapid_api_id);
    } catch {
      coreData = null;
    }
  }

  let understatData = null;
  if (player.understat_id) {
    try {
      const stats = await fetchUnderstatPlayerStats(player.understat_id);
      understatData = Array.isArray(stats) ? { seasons: stats } : { seasons: [] };
    } catch {
      understatData = null;
    }
  }
  const externalStats = await getExternalStatsForPlayer(playerId);
  if (externalStats?.length) {
    understatData = understatData || {};
    understatData.externalStats = externalStats;
  }

  let marketData = null;
  try {
    marketData = await getMarketValueForPlayer(playerId);
  } catch {
    marketData = null;
  }

  return {
    player,
    coreData,
    understatData,
    marketData,
  };
}

/**
 * Normalize string (remove accents for comparison).
 */
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Search: Database-only with accent-insensitive matching.
 * Fast search since all 13,000+ players are already imported.
 * @returns {Promise<{ candidates: object[], source: string }>}
 */
export async function searchCandidates(searchTerm) {
  const trimmed = String(searchTerm).trim();
  if (!trimmed) return { candidates: [], source: 'none' };

  const normalizedTerm = removeAccents(trimmed);
  
  // Use first 3 chars for broad DB query, then filter locally for accent matching
  const prefix = trimmed.slice(0, Math.min(3, trimmed.length));
  
  const { data: dbResults } = await supabase
    .from('players')
    .select('*')
    .ilike('name', `%${prefix}%`)
    .limit(500);

  // Filter for accent-insensitive match
  const fromDb = (dbResults || []).filter((p) => {
    const normalizedName = removeAccents(p.name || '');
    return normalizedName.includes(normalizedTerm);
  });

  // Dedupe and sort
  const byId = new Map();
  for (const p of fromDb) byId.set(p.id, p);
  const candidates = Array.from(byId.values())
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .slice(0, 50);

  return { candidates, source: 'db' };
}

export async function searchOrIngestPlayer(searchTerm) {
  const { candidates } = await searchCandidates(searchTerm);
  if (!candidates.length) throw new Error('Player not found');
  return { player: candidates[0], source: 'db' };
}

/** Debug: raw search shape from available APIs. */
export async function fetchRawSearchShape(searchTerm) {
  const bsdAvailable = bsd.isAvailable();
  const apiSportsAvailable = !!process.env.API_SPORTS_KEY;
  
  let bsdCount = 0;
  let apiSportsCount = 0;
  
  if (bsdAvailable) {
    try {
      const results = await bsd.searchPlayers(searchTerm);
      bsdCount = results.length;
    } catch { /* ignore */ }
  }
  
  if (apiSportsAvailable) {
    try {
      const results = await apiSports.searchPlayers(searchTerm);
      apiSportsCount = results.length;
    } catch { /* ignore */ }
  }

  return {
    bsd: { available: bsdAvailable, results: bsdCount },
    apiSports: { available: apiSportsAvailable, results: apiSportsCount },
    primarySource: bsdAvailable ? 'bsd' : (apiSportsAvailable ? 'api-sports' : 'db-only'),
  };
}
