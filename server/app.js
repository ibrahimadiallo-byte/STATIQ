import express from 'express';
import cors from 'cors';
import { searchCandidates, getPlayerByRapidId } from './playerService.js';
import { getUnifiedProfile } from './profileService.js';
import { ensureProfileFresh } from './refreshService.js';
import { getOrCreateInsight, generateComparisonNarrative } from './aiService.js';
import {
  getLiveFixtures,
  getFixturesToday,
  getTeam,
  getStandings,
  getPlayerStatsByRapidId,
} from './rapidApiService.js';
import { supabase } from './supabase.js';

const app = express();
app.use(cors());
app.use(express.json());

/** Map thrown errors to HTTP status and JSON response (Phase 2: clear 503/502/404). */
function sendError(res, err, defaultMessage = 'Request failed') {
  const msg = err?.message || defaultMessage;
  if (/required env|Missing required|OPENAI_API_KEY is required|RAPIDAPI_KEY is required/.test(msg))
    return res.status(503).json({ error: msg });
  if (/not found|Player not found|No player found/.test(msg))
    return res.status(404).json({ error: msg });
  return res.status(502).json({ error: msg });
}

/** Health check */
app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/players/search?q=...
 * Returns all candidates (stable ID plan). Frontend picks one then GET /api/players/:id for full profile.
 */
app.get('/api/players/search', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const { candidates } = await searchCandidates(q);
    return res.json({ candidates });
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('Player not found') || msg.includes('not found in API')) {
      return res.json({ candidates: [] });
    }
    return sendError(res, err, 'Search failed');
  }
});

/**
 * GET /api/players/by-rapid-id/:rapidId
 * Stable ID: exact lookup by rapid_api_id. Returns our player (uuid) or 404.
 */
app.get('/api/players/by-rapid-id/:rapidId', async (req, res) => {
  try {
    const player = await getPlayerByRapidId(req.params.rapidId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    return res.json(player);
  } catch (err) {
    return sendError(res, err, 'Lookup failed');
  }
});

/**
 * GET /api/players/rapid/:rapidId/stats?season=...
 * Cached player stats by RapidAPI player id (live data plan). Must be before /api/players/:id.
 */
app.get('/api/players/rapid/:rapidId/stats', async (req, res) => {
  try {
    const season = req.query.season?.trim() || null;
    const data = await getPlayerStatsByRapidId(req.params.rapidId, season);
    const list = Array.isArray(data) ? data : [data];
    return res.json({ stats: list, last_updated: new Date().toISOString() });
  } catch (err) {
    return sendError(res, err, 'Player stats failed');
  }
});

/**
 * GET /api/players/:id
 * PRD: player profile — one clean view (player + stats + insight).
 */
app.get('/api/players/:id', async (req, res) => {
  try {
    let profile = await getUnifiedProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Player not found' });
    await ensureProfileFresh(req.params.id, profile);
    profile = await getUnifiedProfile(req.params.id);
    const insight = await getOrCreateInsight(req.params.id, true);
    const summary = insight?.summary_text ?? profile.insight?.summary_text ?? null;
    return res.json({
      player: profile.player,
      stats: profile.stats,
      insight: summary != null ? { summary_text: summary } : null,
    });
  } catch (err) {
    return sendError(res, err, 'Failed to load profile');
  }
});

/**
 * GET /api/compare?p1=uuid&p2=uuid
 * PRD: side-by-side comparison with AI-generated context (deltas + narrative).
 */
app.get('/api/compare', async (req, res) => {
  try {
    const p1 = req.query.p1?.trim();
    const p2 = req.query.p2?.trim();
    if (!p1 || !p2) {
      return res.status(400).json({ error: 'Query parameters "p1" and "p2" (player UUIDs) are required' });
    }

    const [profile1, profile2] = await Promise.all([
      getUnifiedProfile(p1),
      getUnifiedProfile(p2),
    ]);
    if (!profile1) return res.status(404).json({ error: 'Player 1 not found' });
    if (!profile2) return res.status(404).json({ error: 'Player 2 not found' });

    const s1 = profile1.stats?.[0] || {};
    const s2 = profile2.stats?.[0] || {};

    const deltas = {
      goals: (s1.goals ?? 0) - (s2.goals ?? 0),
      assists: (s1.assists ?? 0) - (s2.assists ?? 0),
      xg: Number(s1.xg ?? 0) - Number(s2.xg ?? 0),
      xa: Number(s1.xa ?? 0) - Number(s2.xa ?? 0),
      minutes_played: (s1.minutes_played ?? 0) - (s2.minutes_played ?? 0),
    };

    const narrative = await generateComparisonNarrative(
      profile1.player,
      profile2.player,
      deltas
    );

    return res.json({
      player1: profile1.player,
      player2: profile2.player,
      stats1: profile1.stats,
      stats2: profile2.stats,
      deltas,
      narrative,
    });
  } catch (err) {
    return sendError(res, err, 'Comparison failed');
  }
});

/**
 * PATCH /api/players/:id
 * Body: { understat_id?: string } — link player to Understat for xG/xA ingestion.
 */
app.patch('/api/players/:id', async (req, res) => {
  try {
    const id = req.params.id?.trim();
    const { understat_id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Player ID required' });

    const updates = {};
    if (understat_id !== undefined) updates.understat_id = understat_id ? String(understat_id).trim() : null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update (e.g. understat_id)' });
    }

    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Player not found' });
    return res.json(data);
  } catch (err) {
    return sendError(res, err, 'Update failed');
  }
});

/** Live data (cached) — BACKEND.md Live Data + Stable ID Plan */
app.get('/api/fixtures/live', async (req, res) => {
  try {
    const data = await getLiveFixtures();
    return res.json({ fixtures: data, last_updated: new Date().toISOString() });
  } catch (err) {
    return sendError(res, err, 'Live fixtures failed');
  }
});

app.get('/api/fixtures/today', async (req, res) => {
  try {
    const date = req.query.date?.trim() || null;
    const data = await getFixturesToday(date);
    return res.json({ fixtures: data, date: date || new Date().toISOString().slice(0, 10), last_updated: new Date().toISOString() });
  } catch (err) {
    return sendError(res, err, 'Fixtures today failed');
  }
});

app.get('/api/teams/:teamId', async (req, res) => {
  try {
    const data = await getTeam(req.params.teamId);
    const team = Array.isArray(data) ? data[0] : data;
    if (!team) return res.status(404).json({ error: 'Team not found' });
    return res.json({ team, last_updated: new Date().toISOString() });
  } catch (err) {
    return sendError(res, err, 'Team lookup failed');
  }
});

app.get('/api/standings', async (req, res) => {
  try {
    const league = req.query.league?.trim() || null;
    const season = req.query.season?.trim() || null;
    const data = await getStandings(league, season);
    return res.json({ standings: data, last_updated: new Date().toISOString() });
  } catch (err) {
    return sendError(res, err, 'Standings failed');
  }
});

export default app;
