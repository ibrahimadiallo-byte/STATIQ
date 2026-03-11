import { supabase } from './supabase.js';
import axios from 'axios';

const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com';

/**
 * Search for a player in Supabase first. If not found, fetch from RapidAPI
 * /players (profiles search), save to DB, and return the data.
 * @param {string} searchTerm - Player name (min 3 chars for API search)
 * @returns {Promise<{ player: object, source: 'db' | 'api' }>}
 */
export async function searchOrIngestPlayer(searchTerm) {
  const trimmed = String(searchTerm).trim();
  if (!trimmed) {
    throw new Error('searchTerm is required');
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error('RAPIDAPI_KEY is required for ingest');
  }

  // 1. Check Supabase first (by name, case-insensitive)
  const { data: existing, error: selectError } = await supabase
    .from('players')
    .select('*')
    .ilike('name', `%${trimmed}%`)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Supabase lookup failed: ${selectError.message}`);
  }
  if (existing) {
    return { player: existing, source: 'db' };
  }

  // 2. Fetch from RapidAPI (profiles search by name)
  const { data: apiResponse, status } = await axios.get(
    `${RAPIDAPI_BASE}/players/profiles`,
    {
      params: { search: trimmed },
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      validateStatus: (s) => s < 500,
    }
  );

  if (status !== 200 || !apiResponse?.response?.length) {
    throw new Error(
      apiResponse?.errors?.length
        ? `RapidAPI: ${apiResponse.errors.join(', ')}`
        : 'Player not found in API'
    );
  }

  const first = apiResponse.response[0];
  const p = first.player || first;
  const stats = first.statistics?.[0];
  const teamName = stats?.team?.name ?? null;
  const position = stats?.games?.position ?? null;
  const photoUrl =
    p.photo ||
    (p.id ? `https://media.api-sports.io/football/players/${p.id}.png` : null);

  const row = {
    name: p.name || trimmed,
    rapid_api_id: p.id ?? null,
    understat_id: null,
    team_name: teamName,
    position,
    photo_url: photoUrl || null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('players')
    .insert(row)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to save player: ${insertError.message}`);
  }

  return { player: inserted, source: 'api' };
}
