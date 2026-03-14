/**
 * Market value & brand equity from Supabase/Transfermarkt dataset.
 * Maps player (by player_id) to historical value and Brand Equity metadata.
 */

import { supabase } from './supabase.js';

/**
 * Get market value and brand equity for a player from our Supabase dataset.
 * @param {string} playerId - Our player UUID (players.id)
 * @returns {Promise<{ value_eur?: number, value_history?: object[], brand_equity?: object } | null>}
 */
export async function getMarketValueForPlayer(playerId) {
  if (!playerId) return null;

  const { data, error } = await supabase
    .from('player_market_value')
    .select('value_eur, value_history, brand_equity, source, updated_at')
    .eq('player_id', playerId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Market value lookup failed: ${error.message}`);
  if (!data) return null;

  return {
    value_eur: data.value_eur != null ? Number(data.value_eur) : null,
    value_history: data.value_history || null,
    brand_equity: data.brand_equity || null,
    source: data.source,
    updated_at: data.updated_at,
  };
}

/**
 * Upsert market value row for a player (e.g. after syncing from Transfermarkt).
 * @param {string} playerId - players.id
 * @param {{ value_eur?: number, value_history?: object, brand_equity?: object }} payload
 */
export async function upsertMarketValue(playerId, payload = {}) {
  const { data, error } = await supabase
    .from('player_market_value')
    .upsert(
      {
        player_id: playerId,
        source: 'transfermarkt',
        value_eur: payload.value_eur ?? null,
        value_history: payload.value_history ?? null,
        brand_equity: payload.brand_equity ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,source' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert market value: ${error.message}`);
  return data;
}
