import { supabase } from './supabase.js';
import { syncUnderstatStatsToDb } from './understatService.js';

const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * If profile data is stale (> 24h), refresh from source (Understat when understat_id is set).
 * Build guide: "Add an updated_at check; if data is > 24h old, refresh from source."
 * @param {string} playerId - UUID
 * @param {{ player: object, stats: object[] | null } | null} profile - Current profile (player + stats only)
 */
export async function ensureProfileFresh(playerId, profile) {
  if (!profile?.player) return;

  const player = profile.player;
  const latestStat = profile.stats?.[0] ?? null;
  const now = Date.now();

  const statsStale =
    !latestStat ||
    (latestStat.updated_at && new Date(latestStat.updated_at).getTime() < now - STALE_MS);

  if (statsStale && player.understat_id) {
    try {
      await syncUnderstatStatsToDb(player.understat_id);
    } catch {
      // Non-fatal: continue with existing data
    }
  }
}
