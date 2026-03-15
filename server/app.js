import express from 'express';
import cors from 'cors';
import { searchCandidates, getPlayerByRapidId, fetchRawSearchShape } from './playerService.js';
import { getUnifiedProfile } from './profileService.js';
import { ensureProfileFresh } from './refreshService.js';
import { getOrCreateInsight, generateComparisonNarrative, deleteCachedInsight } from './aiService.js';
import {
  getLiveFixtures,
  getFixturesToday,
  getTeam,
  getStandings,
  getPlayerStatsByRapidId,
  getWorldCupStandings,
  getWorldCupFixtures,
  getWorldCupTeams,
} from './rapidApiService.js';
import {
  fetchWorldCupTrackerWithMomentum,
  isPlayerContributingToMomentumSpike,
} from './worldCupTrackerService.js';
import {
  getGroups as getWC2026Groups,
  getTeams as getWC2026Teams,
  getTournamentInfo as getWC2026Info,
  getCountdown as getWC2026Countdown,
  isPlayerInWorldCup,
} from './worldCup2026Data.js';
import { getPlayerPhoto as getSportsDbPhoto, getPlayerPhotos as getSportsDbPlayerPhotos } from './sportsDbService.js';
import {
  getPremierLeagueMatches,
  getLeagueMatches,
  getTodayMatches,
  getUpcomingMatches,
  getPremierLeagueStandings,
  getWorldCupMatches,
  getWorldCupStandings as getWCStandingsFromAPI,
  isAvailable as isFootballDataAvailable,
  LEAGUES,
} from './footballDataService.js';
import {
  getSyncStatus,
  fullSync,
  refreshPlayer,
  syncPlayerStats,
  scheduleDailySync,
} from './syncService.js';
import { supabase } from './supabase.js';

// Start daily sync scheduler
scheduleDailySync();

const app = express();
app.use(cors());
app.use(express.json());

/** Map thrown errors to HTTP status and JSON response (Phase 2: clear 503/502/404). */
function sendError(res, err, defaultMessage = 'Request failed') {
  const msg = err?.message || defaultMessage;
  if (/required env|Missing required|GROQ_API_KEY|OPENAI_API_KEY|API_SPORTS_KEY is required/.test(msg))
    return res.status(503).json({ error: msg });
  if (/not found|Player not found|No player found/.test(msg))
    return res.status(404).json({ error: msg });
  return res.status(502).json({ error: msg });
}

/** Health check */
app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

/** Verify server has latest code (returns version string). */
app.get('/api/version', (_, res) => {
  res.json({ version: 'debug2-rawShape' });
});

/** Get player photo from TheSportsDB (fallback source) */
app.get('/api/photo/:playerName', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.playerName);
    const photoUrl = await getSportsDbPhoto(name);
    if (photoUrl) {
      return res.json({ photo_url: photoUrl, source: 'thesportsdb' });
    }
    return res.status(404).json({ error: 'Photo not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Debug: inspect raw API response shape (why search might return empty). */
app.get('/api/debug/raw-search', async (req, res) => {
  try {
    const q = req.query.q?.trim() || 'Mbappe';
    const shape = await fetchRawSearchShape(q);
    return res.json(shape);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/players/search?q=...
 * Returns all candidates (stable ID plan). Frontend picks one then GET /api/players/:id for full profile.
 * Add ?debug=1 to get a hint when candidates are empty (e.g. API returned empty or errors).
 */
app.get('/api/players/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  const out = { candidates: [] };
  if (req.query.debug === '2') {
    try {
      out.rawShape = await fetchRawSearchShape(q);
    } catch (e) {
      out.rawShapeError = e.message;
    }
  }
  try {
    let { candidates } = await searchCandidates(q);
    const needPhoto = candidates.filter((p) => !(p.photo_url && String(p.photo_url).trim()));
    if (needPhoto.length > 0) {
      const names = needPhoto.map((p) => p.name).filter(Boolean);
      const photoMap = await getSportsDbPlayerPhotos(names);
      candidates = candidates.map((p) => {
        if (!(p.photo_url && String(p.photo_url).trim()) && p.name && photoMap.get(p.name))
          return { ...p, photo_url: photoMap.get(p.name) };
        return p;
      });
    }
    out.candidates = candidates.map((p) => fixPhotoUrl(p));
    if (candidates.length === 0) {
      out.suggestions = ['Mbappé', 'Haaland', 'Bellingham'];
      out.debug = {
        hint: 'API returned no players. Check API_SPORTS_KEY and API_SPORTS_URL in .env.',
        API_SPORTS_KEY_set: !!process.env.API_SPORTS_KEY,
        API_SPORTS_URL: process.env.API_SPORTS_URL || '(default)',
      };
    }
    return res.json(out);
  } catch (err) {
    const msg = err?.message || '';
    out.searchError = msg;
    out.candidates = out.candidates || [];
    out.suggestions = ['Mbappé', 'Haaland', 'Bellingham'];
    if (req.query.debug === '2') return res.json(out);
    if (msg.includes('Player not found') || msg.includes('not found in API')) {
      return res.json(out);
    }
    // Only return 503 when env is missing (service unavailable); otherwise 200 + empty candidates so UI doesn't 502
    if (/required env|Missing required|API_SPORTS_KEY is required/.test(msg)) {
      return sendError(res, err, 'Search failed');
    }
    console.error('[search]', q, err?.message || err);
    return res.status(200).json(out);
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

/** Generate UI Avatars URL - fallback when no real photo (initials). */
function getAvatarUrl(name) {
  const displayName = name || 'Player';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1520A6&color=fff&size=128&bold=true`;
}

/** API-Sports CDN URL when we have rapid_api_id (often works without auth). */
function getApiSportsPhotoUrl(rapidApiId) {
  if (rapidApiId == null) return null;
  const id = Number(rapidApiId);
  return Number.isFinite(id) ? `https://media.api-sports.io/football/players/${id}.png` : null;
}

/** Custom photos for star players (local assets); avoids initials fallback. */
function getCustomStarPhotoUrl(playerName) {
  const n = (playerName && String(playerName).trim()).toLowerCase();
  if (n === 'lionel messi') return '/messi.png';
  if (n === 'cristiano ronaldo') return '/ronaldo.png';
  if (n === 'jude bellingham' || n === 'bellingham') return '/bellingham.png';
  return null;
}

/** Use real photo_url when present; custom star assets; else API-Sports; else initials avatar. */
function fixPhotoUrl(player) {
  if (!player) return player;
  const custom = getCustomStarPhotoUrl(player.name);
  if (custom) return { ...player, photo_url: custom };
  let photo_url = (player.photo_url && String(player.photo_url).trim()) ? player.photo_url : null;
  if (!photo_url && player.rapid_api_id) photo_url = getApiSportsPhotoUrl(player.rapid_api_id);
  if (!photo_url) photo_url = getAvatarUrl(player.name);
  return { ...player, photo_url };
}

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
    if (profile.player && !(profile.player.photo_url && String(profile.player.photo_url).trim()) && profile.player.name) {
      try {
        const fallbackPhoto = await getSportsDbPhoto(profile.player.name);
        if (fallbackPhoto) profile = { ...profile, player: { ...profile.player, photo_url: fallbackPhoto } };
      } catch (_) { /* ignore */ }
    }
    let insight = await getOrCreateInsight(req.params.id, true);
    const s = profile.stats?.[0];
    const hasStats = s && ((s.minutes_played ?? 0) > 0 || (s.goals ?? 0) > 0 || (s.assists ?? 0) > 0);
    const summaryText = insight?.summary_text ?? '';
    const insightSaysNoStats = /0 minutes|no minutes played|non-existent|no goal contributions/i.test(summaryText);
    if (hasStats && insightSaysNoStats) {
      try {
        await deleteCachedInsight(req.params.id);
        insight = await getOrCreateInsight(req.params.id, true);
      } catch (_) { /* keep existing insight on error */ }
    }
    const summary = insight?.summary_text ?? profile.insight?.summary_text ?? null;
    return res.json({
      player: fixPhotoUrl(profile.player),
      stats: profile.stats,
      externalStats: profile.externalStats ?? null,
      insight: summary != null ? { summary_text: summary } : null,
      digitalImpact: profile.digitalImpact ?? null,
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

    const narrativeResult = await generateComparisonNarrative(
      { ...profile1.player, stats: profile1.stats },
      { ...profile2.player, stats: profile2.stats },
      deltas
    );

    return res.json({
      player1: fixPhotoUrl(profile1.player),
      player2: fixPhotoUrl(profile2.player),
      stats1: profile1.stats,
      stats2: profile2.stats,
      deltas,
      narrative: narrativeResult.narrative,
      verdict: narrativeResult.verdict,
      sustainability: narrativeResult.sustainability,
      analysis: narrativeResult.analysis,
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

/** World Cup 2026 — Static data: 48 teams, 12 groups, host cities */
app.get('/api/world-cup/info', (req, res) => {
  const info = getWC2026Info();
  const countdown = getWC2026Countdown();
  return res.json({ ...info, countdown });
});

app.get('/api/world-cup/groups', (req, res) => {
  const groups = getWC2026Groups();
  return res.json({ groups, totalGroups: groups.length });
});

app.get('/api/world-cup/teams', (req, res) => {
  const confederation = req.query.confederation?.trim();
  let teams = getWC2026Teams();
  if (confederation) {
    teams = teams.filter((t) => t.confederation.toLowerCase() === confederation.toLowerCase());
  }
  return res.json({ teams, totalTeams: teams.length });
});

app.get('/api/world-cup/standings', (req, res) => {
  const groups = getWC2026Groups();
  const standings = groups.map((g) => ({
    group: g.id,
    name: g.name,
    teams: g.teams.map((t, i) => ({
      position: i + 1,
      ...t,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })),
  }));
  return res.json({ standings, message: 'Tournament starts June 11, 2026' });
});

app.get('/api/world-cup/fixtures', (req, res) => {
  const info = getWC2026Info();
  return res.json({
    fixtures: [],
    message: 'Fixtures will be available closer to tournament start',
    keyDates: info.keyDates,
  });
});

app.get('/api/world-cup/check-player', async (req, res) => {
  try {
    const playerId = req.query.playerId?.trim();
    const nationality = req.query.nationality?.trim();
    
    let nat = nationality;
    if (playerId && !nat) {
      const { getPlayerById } = await import('./playerService.js');
      const player = await getPlayerById(playerId);
      nat = player?.nationality;
    }
    
    if (!nat) {
      return res.status(400).json({ error: 'Provide playerId or nationality' });
    }
    
    const result = isPlayerInWorldCup(nat);
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'World Cup check failed');
  }
});

/** Enetpulse World Cup 2026 Tracker: group stage progress + Momentum Spike (goals + VAR). */
app.get('/api/world-cup/tracker', async (req, res) => {
  try {
    const league = req.query.league ? parseInt(req.query.league, 10) : undefined;
    const season = req.query.season ? parseInt(req.query.season, 10) : undefined;
    const data = await fetchWorldCupTrackerWithMomentum(league, season);
    return res.json(data);
  } catch (err) {
    return sendError(res, err, 'World Cup tracker failed');
  }
});

/** Check if a player is contributing to a Momentum Spike (by playerId or teamName). */
app.get('/api/world-cup/momentum-spike', async (req, res) => {
  try {
    const playerId = req.query.playerId?.trim();
    const teamName = req.query.teamName?.trim();
    let player = null;
    if (playerId) {
      const { getPlayerById } = await import('./playerService.js');
      player = await getPlayerById(playerId);
    }
    if (!player && teamName) player = { team_name: teamName };
    if (!player) {
      return res.status(400).json({ error: 'Provide playerId or teamName' });
    }
    const result = await isPlayerContributingToMomentumSpike(player);
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Momentum spike check failed');
  }
});

/** ===================== DATA SYNC ENDPOINTS ===================== */

/** Get sync status */
app.get('/api/sync/status', (req, res) => {
  const status = getSyncStatus();
  return res.json(status);
});

/** Trigger full sync of all players from BSD API */
app.post('/api/sync/full', async (req, res) => {
  try {
    const result = await fullSync();
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Full sync failed');
  }
});

/** Refresh a single player's data from BSD API */
app.post('/api/sync/player/:id', async (req, res) => {
  try {
    const result = await refreshPlayer(req.params.id);
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Player refresh failed');
  }
});

/** Sync player match stats (xG, xA, goals, assists) from BSD API */
app.post('/api/sync/player/:id/stats', async (req, res) => {
  try {
    const result = await syncPlayerStats(req.params.id);
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Stats sync failed');
  }
});

/** Regenerate AI insight for a player (clears cache; next profile load will generate from current DB stats) */
app.post('/api/players/:id/regenerate-insight', async (req, res) => {
  try {
    const id = req.params.id?.trim();
    if (!id) return res.status(400).json({ error: 'Player ID required' });
    const profile = await getUnifiedProfile(id);
    if (!profile) return res.status(404).json({ error: 'Player not found' });
    await deleteCachedInsight(id);
    return res.json({ ok: true, message: 'Insight cache cleared; next profile load will regenerate.' });
  } catch (err) {
    return sendError(res, err, 'Failed to regenerate insight');
  }
});

/** Seed demo stats for key players (for MVP demo when API limits reached) */
app.post('/api/seed-demo-stats', async (req, res) => {
  const { supabase } = await import('./supabase.js');
  
  const demoStats = [
    { name: 'Lionel Messi', season: '2025-26', goals: 23, assists: 13, xg: 18.5, xa: 11.2, minutes_played: 2890 },
    { name: 'Cristiano Ronaldo', season: '2025-26', goals: 35, assists: 8, xg: 28.3, xa: 5.1, minutes_played: 3150 },
    { name: 'Kylian Mbappé', season: '2025-26', goals: 28, assists: 10, xg: 24.7, xa: 8.9, minutes_played: 2760 },
    { name: 'Erling Haaland', season: '2025-26', goals: 32, assists: 5, xg: 27.1, xa: 3.8, minutes_played: 2680 },
    { name: 'Vinicius Junior', season: '2025-26', goals: 18, assists: 12, xg: 14.2, xa: 9.5, minutes_played: 2540 },
    { name: 'Jude Bellingham', season: '2025-26', goals: 15, assists: 9, xg: 12.8, xa: 7.3, minutes_played: 2890 },
    { name: 'Mohamed Salah', season: '2025-26', goals: 22, assists: 14, xg: 19.6, xa: 10.8, minutes_played: 3020 },
    { name: 'Kevin De Bruyne', season: '2025-26', goals: 8, assists: 18, xg: 6.5, xa: 15.2, minutes_played: 2100 },
    { name: 'Bukayo Saka', season: '2025-26', goals: 14, assists: 11, xg: 11.3, xa: 9.1, minutes_played: 2780 },
    { name: 'Lamine Yamal', season: '2025-26', goals: 9, assists: 14, xg: 7.2, xa: 11.8, minutes_played: 2450 },
  ];

  let seeded = 0;
  for (const stat of demoStats) {
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .ilike('name', `%${stat.name}%`)
      .limit(1);
    
    if (players?.length > 0) {
      const playerId = players[0].id;
      // Delete existing stats for this player/season, then insert
      await supabase.from('player_stats').delete().eq('player_id', playerId).eq('season', stat.season);
      await supabase.from('player_stats').insert({
        player_id: playerId,
        season: stat.season,
        goals: stat.goals,
        assists: stat.assists,
        xg: stat.xg,
        xa: stat.xa,
        minutes_played: stat.minutes_played,
        updated_at: new Date().toISOString(),
      });
      seeded++;
    }
  }

  return res.json({ success: true, seeded, total: demoStats.length });
});

/** ===================== FIXTURES ENDPOINTS (Football-Data.org) ===================== */

/** Get available leagues */
app.get('/api/leagues', (req, res) => {
  return res.json({ leagues: Object.values(LEAGUES) });
});

/** Get matches for any league */
app.get('/api/fixtures/league/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const limit = parseInt(req.query.limit) || 10;
    const matches = await getLeagueMatches(code, 'SCHEDULED', limit);
    const league = LEAGUES[code] || { code, name: code };
    return res.json({ matches, league, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Get Premier League upcoming matches (backward compatible) */
app.get('/api/fixtures/premier-league', async (req, res) => {
  try {
    const matches = await getPremierLeagueMatches('SCHEDULED');
    return res.json({ matches, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Get today's matches */
app.get('/api/fixtures/today', async (req, res) => {
  try {
    const matches = await getTodayMatches();
    return res.json({ matches, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Get upcoming matches (next 7 days) */
app.get('/api/fixtures/upcoming', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const matches = await getUpcomingMatches(days);
    return res.json({ matches, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Get Premier League standings */
app.get('/api/standings/premier-league', async (req, res) => {
  try {
    const standings = await getPremierLeagueStandings();
    return res.json({ standings, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Get World Cup 2026 matches */
app.get('/api/fixtures/world-cup', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const matches = await getWorldCupMatches(limit);
    return res.json({ matches, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Get World Cup 2026 standings/groups */
app.get('/api/standings/world-cup', async (req, res) => {
  try {
    const standings = await getWCStandingsFromAPI();
    return res.json({ standings, source: 'football-data.org' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Clear all cached insights (for regeneration with new format) */
app.post('/api/admin/clear-insights', async (req, res) => {
  try {
    const { error, count } = await supabase
      .from('insight_reports')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (error) throw error;
    return res.json({ message: 'All insights cleared', deleted: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** HEART: Log AI insight thumbs up/down */
app.post('/api/insight-feedback', async (req, res) => {
  try {
    const { playerId, helpful } = req.body;
    if (!playerId || typeof helpful !== 'boolean') {
      return res.status(400).json({ error: 'playerId and helpful (boolean) required' });
    }
    const { error } = await supabase
      .from('insight_feedback')
      .insert({ player_id: playerId, helpful });
    if (error) {
      console.warn('[insight-feedback]', error.message);
      return res.status(200).json({ ok: true }); // still succeed so UI doesn't break
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default app;
