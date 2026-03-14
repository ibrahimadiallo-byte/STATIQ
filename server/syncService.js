/**
 * Sync Service - Keeps player data up-to-date from BSD API.
 * 
 * Features:
 * - Full sync: Updates all players from BSD API
 * - Player refresh: Updates a single player's data
 * - Stats sync: Fetches latest match stats for players
 */

import { supabase } from './supabase.js';
import * as bsd from './bsdService.js';

let lastFullSync = null;
let syncInProgress = false;

/**
 * Get sync status.
 */
export function getSyncStatus() {
  return {
    lastFullSync,
    syncInProgress,
    bsdAvailable: bsd.isAvailable(),
  };
}

/**
 * Full sync - Update all players from BSD API.
 * This fetches all players and upserts them into the database.
 */
export async function fullSync() {
  if (syncInProgress) {
    return { success: false, message: 'Sync already in progress' };
  }

  if (!bsd.isAvailable()) {
    return { success: false, message: 'BSD API not available (check BSD_API_TOKEN)' };
  }

  syncInProgress = true;
  const startTime = Date.now();
  let updated = 0;
  let errors = 0;

  try {
    console.log('[Sync] Starting full sync from BSD API...');
    
    const allPlayers = await bsd.fetchAllPlayers();
    console.log(`[Sync] Fetched ${allPlayers.length} players from BSD`);

    const BATCH_SIZE = 100;
    for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
      const batch = allPlayers.slice(i, i + BATCH_SIZE);
      const rows = batch.map((p) => ({
        name: p.name || p.short_name,
        rapid_api_id: p.api_id,
        team_name: p.current_team?.name || null,
        position: normalizePosition(p.position),
        photo_url: bsd.getPlayerPhotoUrl(p.api_id),
      }));

      const { error } = await supabase
        .from('players')
        .upsert(rows, { onConflict: 'rapid_api_id', ignoreDuplicates: false });

      if (error) {
        console.error('[Sync] Batch error:', error.message);
        errors++;
      } else {
        updated += batch.length;
      }
    }

    lastFullSync = new Date().toISOString();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Sync] Complete: ${updated} players updated in ${duration}s`);

    return {
      success: true,
      updated,
      errors,
      duration: `${duration}s`,
      timestamp: lastFullSync,
    };
  } catch (err) {
    console.error('[Sync] Failed:', err.message);
    return { success: false, message: err.message };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Refresh a single player's data from BSD API.
 */
export async function refreshPlayer(playerId) {
  if (!bsd.isAvailable()) {
    return { success: false, message: 'BSD API not available' };
  }

  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  if (!player.rapid_api_id) {
    return { success: false, message: 'Player has no BSD API ID' };
  }

  try {
    const bsdPlayer = await bsd.getPlayerById(player.rapid_api_id);
    if (!bsdPlayer) {
      return { success: false, message: 'Player not found in BSD API' };
    }

    const { error } = await supabase
      .from('players')
      .update({
        name: bsdPlayer.name || bsdPlayer.short_name,
        team_name: bsdPlayer.current_team?.name || player.team_name,
        position: normalizePosition(bsdPlayer.position) || player.position,
        photo_url: bsd.getPlayerPhotoUrl(bsdPlayer.api_id),
      })
      .eq('id', playerId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, player: bsdPlayer };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Fetch and store player match stats from BSD API.
 */
export async function syncPlayerStats(playerId) {
  if (!bsd.isAvailable()) {
    return { success: false, message: 'BSD API not available' };
  }

  const { data: player } = await supabase
    .from('players')
    .select('rapid_api_id')
    .eq('id', playerId)
    .single();

  if (!player?.rapid_api_id) {
    return { success: false, message: 'Player not found or has no BSD API ID' };
  }

  try {
    const stats = await bsd.getPlayerStats(player.rapid_api_id);
    
    if (!stats.length) {
      return { success: true, message: 'No stats available', stats: [] };
    }

    // Aggregate season totals from match stats
    const seasonTotals = {};
    for (const match of stats) {
      const season = match.event?.event_date?.slice(0, 4) || 'unknown';
      if (!seasonTotals[season]) {
        seasonTotals[season] = {
          goals: 0,
          assists: 0,
          xg: 0,
          xa: 0,
          minutes_played: 0,
          matches: 0,
        };
      }
      seasonTotals[season].goals += match.goals || 0;
      seasonTotals[season].assists += match.goal_assist || 0;
      seasonTotals[season].xg += match.expected_goals || 0;
      seasonTotals[season].xa += match.expected_assists || 0;
      seasonTotals[season].minutes_played += match.minutes_played || 0;
      seasonTotals[season].matches++;
    }

    // Upsert stats into player_stats table
    for (const [season, totals] of Object.entries(seasonTotals)) {
      await supabase
        .from('player_stats')
        .upsert({
          player_id: playerId,
          season,
          goals: totals.goals,
          assists: totals.assists,
          xg: totals.xg.toFixed(2),
          xa: totals.xa.toFixed(2),
          minutes_played: totals.minutes_played,
        }, { onConflict: 'player_id,season' });
    }

    return {
      success: true,
      seasons: Object.keys(seasonTotals).length,
      totalMatches: stats.length,
      stats: seasonTotals,
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function normalizePosition(pos) {
  const map = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Attacker' };
  return map[pos] || pos || null;
}

/**
 * Schedule daily sync (call this on server start).
 */
export function scheduleDailySync() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  console.log('[Sync] Daily sync scheduled');
  
  setInterval(async () => {
    console.log('[Sync] Running scheduled daily sync...');
    await fullSync();
  }, TWENTY_FOUR_HOURS);
}
