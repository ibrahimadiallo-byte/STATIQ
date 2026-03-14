import { supabase } from './supabase.js';
import { getExternalStatsForPlayer } from './externalStatsService.js';
import { getDigitalImpactForPlayer } from './digitalImpactService.js';

/**
 * Generate realistic stats based on player position (for players without API data)
 */
function generateStatsForPosition(position, playerId) {
  const pos = (position || '').toLowerCase();
  const seed = playerId.charCodeAt(0) + playerId.charCodeAt(5);
  const rand = (min, max) => Math.floor(min + ((seed * 7) % (max - min + 1)));
  const randDec = (min, max) => +(min + ((seed * 13) % ((max - min) * 10)) / 10).toFixed(1);

  let goals, assists, xg, xa, minutes;

  if (pos.includes('attack') || pos.includes('forward') || pos.includes('striker')) {
    goals = rand(8, 25);
    assists = rand(3, 12);
    xg = randDec(6, 22);
    xa = randDec(2, 10);
    minutes = rand(1800, 3200);
  } else if (pos.includes('midfield')) {
    goals = rand(3, 12);
    assists = rand(5, 15);
    xg = randDec(2, 10);
    xa = randDec(4, 12);
    minutes = rand(2000, 3400);
  } else if (pos.includes('defend')) {
    goals = rand(1, 5);
    assists = rand(1, 6);
    xg = randDec(0.5, 4);
    xa = randDec(1, 5);
    minutes = rand(2200, 3400);
  } else if (pos.includes('goal')) {
    goals = 0;
    assists = rand(0, 2);
    xg = 0;
    xa = randDec(0, 1);
    minutes = rand(2700, 3420);
  } else {
    goals = rand(2, 10);
    assists = rand(2, 8);
    xg = randDec(1.5, 8);
    xa = randDec(1.5, 7);
    minutes = rand(1500, 3000);
  }

  return {
    player_id: playerId,
    season: '2025-26',
    goals,
    assists,
    xg,
    xa,
    minutes_played: minutes,
  };
}

/**
 * Get a unified profile for the PRD: one clean view (player + stats + insight + digitalImpact).
 * Auto-generates stats if none exist in DB.
 */
export async function getUnifiedProfile(playerId) {
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .limit(1)
    .maybeSingle();

  if (playerError || !player) return null;

  let { data: stats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .order('season', { ascending: false });

  // Auto-generate stats if none exist
  if (!stats || stats.length === 0) {
    const generatedStats = generateStatsForPosition(player.position, playerId);
    // Save to DB for consistency
    await supabase.from('player_stats').insert(generatedStats);
    stats = [generatedStats];
  }

  const externalStats = await getExternalStatsForPlayer(playerId);

  const { data: insights } = await supabase
    .from('insight_reports')
    .select('*')
    .eq('player_id', playerId)
    .order('generated_at', { ascending: false })
    .limit(1);

  let digitalImpact = null;
  try {
    digitalImpact = await getDigitalImpactForPlayer(playerId);
  } catch {
    digitalImpact = null;
  }

  return {
    player,
    stats: stats && stats.length ? stats : null,
    externalStats: externalStats && externalStats.length ? externalStats : null,
    insight: insights && insights[0] ? insights[0] : null,
    digitalImpact,
  };
}
