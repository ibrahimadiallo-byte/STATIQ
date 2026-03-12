import { supabase } from './supabase.js';
import { getExternalStatsForPlayer } from './externalStatsService.js';

/**
 * Get a unified profile for the PRD: one clean view (player + stats + insight).
 * @param {string} playerId - UUID from players.id
 * @returns {Promise<{ player: object, stats: object[] | null, insight: object | null } | null>}
 */
export async function getUnifiedProfile(playerId) {
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .limit(1)
    .maybeSingle();

  if (playerError || !player) return null;

  const { data: stats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .order('season', { ascending: false });

  const externalStats = await getExternalStatsForPlayer(playerId);

  const { data: insights } = await supabase
    .from('insight_reports')
    .select('*')
    .eq('player_id', playerId)
    .order('generated_at', { ascending: false })
    .limit(1);

  return {
    player,
    stats: stats && stats.length ? stats : null,
    externalStats: externalStats && externalStats.length ? externalStats : null,
    insight: insights && insights[0] ? insights[0] : null,
  };
}
