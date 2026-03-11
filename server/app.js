import express from 'express';
import cors from 'cors';
import { searchOrIngestPlayer } from './playerService.js';
import { getUnifiedProfile } from './profileService.js';
import { getOrCreateInsight, generateComparisonNarrative } from './aiService.js';
import { supabase } from './supabase.js';

const app = express();
app.use(cors());
app.use(express.json());

/** Health check */
app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/players/search?q=...
 * PRD: player search → unified profile (aggregated key stats in one view).
 */
app.get('/api/players/search', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const { player, source } = await searchOrIngestPlayer(q);
    const profile = await getUnifiedProfile(player.id);
    const insight = await getOrCreateInsight(player.id, true);
    return res.json({
      source,
      player: profile.player,
      stats: profile.stats,
      insight: insight ? { summary_text: insight.summary_text } : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
});

/**
 * GET /api/players/:id
 * PRD: player profile — one clean view (player + stats + insight).
 */
app.get('/api/players/:id', async (req, res) => {
  try {
    const profile = await getUnifiedProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Player not found' });
    const insight = await getOrCreateInsight(req.params.id, true);
    const summary = insight?.summary_text ?? profile.insight?.summary_text ?? null;
    return res.json({
      player: profile.player,
      stats: profile.stats,
      insight: summary != null ? { summary_text: summary } : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load profile' });
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
    return res.status(500).json({ error: err.message || 'Comparison failed' });
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
    return res.status(500).json({ error: err.message || 'Update failed' });
  }
});

export default app;
