import OpenAI from 'openai';
import { supabase } from './supabase.js';

const AI_TIMEOUT_MS = 9000; // Under Vercel 10s limit

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), ms)
    ),
  ]).catch((err) => {
    if (err.message === 'AI request timed out') return fallback;
    throw err;
  });
}

/**
 * Generate a 2-sentence plain-language scouting summary (PRD: AI insight report).
 * Saves to insight_reports and returns the text. Times out after 9s (Vercel-safe).
 */
export async function generateAndCacheInsight(playerId, player, stats) {
  if (!openai) throw new Error('OPENAI_API_KEY is required for AI insights');

  const latest = Array.isArray(stats) && stats.length ? stats[0] : null;
  const payload = {
    name: player?.name,
    position: player?.position,
    team: player?.team_name,
    season: latest?.season,
    goals: latest?.goals,
    assists: latest?.assists,
    xg: latest?.xg,
    xa: latest?.xa,
    minutes_played: latest?.minutes_played,
  };

  const completionPromise = openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a football scout. Write exactly 2 short sentences in plain language: the first on current form and performance, the second on what the numbers mean for the player. No jargon. Be concise.',
      },
      {
        role: 'user',
        content: `Summarize this player's stats in 2 sentences:\n${JSON.stringify(payload)}`,
      },
    ],
    max_tokens: 150,
  });

  const completion = await withTimeout(
    completionPromise,
    AI_TIMEOUT_MS,
    null
  );
  if (!completion) {
    throw new Error('Insight temporarily unavailable (timeout). Try again shortly.');
  }

  const summary_text =
    completion?.choices?.[0]?.message?.content?.trim() || 'No summary generated.';

  const { data: report, error } = await supabase
    .from('insight_reports')
    .insert({ player_id: playerId, summary_text })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save insight: ${error.message}`);
  return { summary_text, report_id: report.id };
}

/**
 * Get latest insight for a player; optionally generate if missing.
 * @param {string} playerId - UUID
 * @param {boolean} generateIfMissing - If true, fetch player+stats and call generateAndCacheInsight when no report exists
 * @returns {Promise<{ summary_text: string } | null>}
 */
export async function getOrCreateInsight(playerId, generateIfMissing = false) {
  const { data: rows } = await supabase
    .from('insight_reports')
    .select('summary_text')
    .eq('player_id', playerId)
    .order('generated_at', { ascending: false })
    .limit(1);

  if (rows && rows[0]) return { summary_text: rows[0].summary_text };

  if (!generateIfMissing) return null;

  const { getUnifiedProfile } = await import('./profileService.js');
  const profile = await getUnifiedProfile(playerId);
  if (!profile) return null;

  const { summary_text } = await generateAndCacheInsight(
    playerId,
    profile.player,
    profile.stats
  );
  return { summary_text };
}

/**
 * Generate a short AI narrative for a player comparison (PRD: comparison with AI-generated context).
 * @param {object} player1 - { name, ... } and optionally stats
 * @param {object} player2 - { name, ... } and optionally stats
 * @param {object} deltas - e.g. { goals, assists, xg, xa }
 * @returns {Promise<string>}
 */
export async function generateComparisonNarrative(player1, player2, deltas) {
  if (!openai) return 'Comparison narrative unavailable (missing OPENAI_API_KEY).';

  const completionPromise = openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a football analyst. In 1–2 sentences, explain who is ahead in form and the key difference between these two players. Use plain language for fans.',
      },
      {
        role: 'user',
        content: `Player A: ${player1.name}. Player B: ${player2.name}. Deltas (A vs B): ${JSON.stringify(deltas)}. Who is ahead and in what?`,
      },
    ],
    max_tokens: 120,
  });

  const completion = await withTimeout(
    completionPromise,
    AI_TIMEOUT_MS,
    null
  );
  if (!completion) return 'Comparison narrative temporarily unavailable (timeout).';
  return completion?.choices?.[0]?.message?.content?.trim() || 'No comparison narrative.';
}
