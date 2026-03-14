/**
 * Digital Impact — Nielsen Fan Insights dataset in Supabase.
 * Fetches social media engagement spikes and regional fan demographics
 * to quantify the 'Hype' a player is generating ahead of the World Cup.
 */

import { supabase } from './supabase.js';

/**
 * Get Digital Impact for a player (engagement spikes + regional demographics + hype).
 * @param {string} playerId - players.id UUID
 * @returns {Promise<{ engagementSpikes: object[], regionalDemographics: object[], hypeScore: number | null } | null>}
 */
export async function getDigitalImpactForPlayer(playerId) {
  if (!playerId) return null;

  const { data, error } = await supabase
    .from('nielsen_fan_insights')
    .select('engagement_spikes, regional_demographics, hype_score, updated_at')
    .eq('player_id', playerId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Digital impact lookup failed: ${error.message}`);
  if (!data) return null;

  return {
    engagementSpikes: Array.isArray(data.engagement_spikes) ? data.engagement_spikes : [],
    regionalDemographics: Array.isArray(data.regional_demographics) ? data.regional_demographics : [],
    hypeScore: data.hype_score != null ? Number(data.hype_score) : null,
    updatedAt: data.updated_at,
  };
}

/**
 * Upsert Nielsen Fan Insights row for a player (e.g. after sync from Nielsen pipeline).
 * @param {string} playerId
 * @param {{ engagementSpikes?: object[], regionalDemographics?: object[], hypeScore?: number }} payload
 */
export async function upsertDigitalImpact(playerId, payload = {}) {
  const { data, error } = await supabase
    .from('nielsen_fan_insights')
    .upsert(
      {
        player_id: playerId,
        engagement_spikes: payload.engagementSpikes ?? [],
        regional_demographics: payload.regionalDemographics ?? [],
        hype_score: payload.hypeScore ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert digital impact: ${error.message}`);
  return data;
}
