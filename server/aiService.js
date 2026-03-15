import OpenAI from 'openai';
import { supabase } from './supabase.js';

const AI_TIMEOUT_MS = 15000; // Increased for Groq

// Groq (primary - free, fast) or OpenAI (fallback)
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Use Groq if available, otherwise OpenAI
const ai = groq || openai;
const AI_MODEL = groq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

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
 * Uses core stats plus any external_stats rows (multi-source) and saves to insight_reports.
 * Times out after 9s (Vercel-safe).
 */
export async function generateAndCacheInsight(
  playerId,
  player,
  stats,
  externalStats = null
) {
  if (!ai) throw new Error('GROQ_API_KEY or OPENAI_API_KEY is required for AI insights');

  const latest = Array.isArray(stats) && stats.length ? stats[0] : null;
   // Trim external stats so prompt stays small but multi-source-aware.
  const externalSummary = Array.isArray(externalStats)
    ? externalStats.slice(0, 3).map((row) => ({
        source: row.source,
        season: row.season,
        payload: row.payload,
      }))
    : null;
  const goals = latest?.goals ?? 0;
  const xg = Number(latest?.xg ?? 0);
  const assists = latest?.assists ?? 0;
  const xa = Number(latest?.xa ?? 0);
  const minutes = latest?.minutes_played ?? 0;
  const minsPerGoal = goals > 0 && minutes > 0 ? Math.round(minutes / goals) : null;

  const completionPromise = ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an elite football analyst for STATIQ. Explain what a player's stats actually mean in plain language. Be specific, reference the numbers directly, write like a confident sports journalist.
When the player is a midfielder or defender, lead with non-obvious contributions (e.g. ball recoveries, line-breaking passes, defensive actions) when you can—not just goals and assists.
Where relevant, describe behavioral or tactical patterns, not only totals. Write so the insight is quotable and specific enough for a video script. Never generic.`,
      },
      {
        role: 'user',
        content: `Analyze ${player?.name}'s ${latest?.season || '2025-26'} season:
Goals: ${goals}, xG: ${xg}, gap: ${goals - xg}
Assists: ${assists}, xA: ${xa}
Minutes: ${minutes}, mins/goal: ${minsPerGoal ?? 'n/a'}
Position: ${player?.position ?? 'unknown'}

Return ONLY JSON:
{
  "bullets": ["3 findings, max 8 words each, specific to these numbers. First bullet: lead with non-obvious contribution when relevant (midfield/defence)."],
  "analysis": "2-3 sentences. Reference specific stats. Explain the xG gap. State whether form is sustainable. Never generic."
}`,
      },
    ],
    max_tokens: 400,
  });

  const completion = await withTimeout(
    completionPromise,
    AI_TIMEOUT_MS,
    null
  );
  if (!completion) {
    throw new Error('Insight temporarily unavailable (timeout). Try again shortly.');
  }

  const rawContent = completion?.choices?.[0]?.message?.content?.trim() || '';
  let bullets = [];
  let full_text = '';

  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 3) : [];
      full_text = parsed.analysis || parsed.full_text || '';
    } catch (_) {}
  }
  if (bullets.length === 0) {
    const bulletMatches = rawContent.match(/[•\-\*]\s*([^\n•\-\*]+)/g) || [];
    bullets = bulletMatches.slice(0, 3).map(b => b.replace(/^[•\-\*]\s*/, '').trim());
  }
  if (!full_text) {
    const paragraphMatch = rawContent.match(/(?:PARAGRAPH|analysis):\s*(.+)/is);
    full_text = paragraphMatch ? paragraphMatch[1].trim() : rawContent.substring(0, 300);
  }
  if (bullets.length < 3) {
    const sentences = rawContent.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
    while (bullets.length < 3 && sentences.length > 0) {
      const sent = sentences.shift().replace(/^[•\-\*\d.]\s*/, '').trim();
      if (sent && !bullets.includes(sent)) bullets.push(sent);
    }
  }
  if (bullets.length === 0) bullets = ['Form in stats', 'See analysis below', 'Check xG/xA'];
  if (!full_text) full_text = rawContent.substring(0, 300);

  // Store as JSON string for flexibility
  const summary_text = JSON.stringify({ bullets, full_text });

  const { data: report, error } = await supabase
    .from('insight_reports')
    .insert({ player_id: playerId, summary_text })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save insight: ${error.message}`);
  return { summary_text, report_id: report.id, bullets, full_text };
}

/**
 * STATIQ AI Narrative Workflow: clinical scouting report from multi-source data.
 * Takes core (api-sports), advanced (Understat xG/xA), and market (Transfermarkt) and
 * sends to OpenAI to generate a report combining xG with movement/line-breaking insights (PRD style).
 *
 * @param {string} playerId - Our player UUID
 * @param {{ player: object, coreData: object|null, understatData: object|null, marketData: object|null }} aggregated - from getAggregatedPlayerData
 * @returns {Promise<{ summary_text: string, report_id: string }>}
 */
export async function generatePlayerReport(playerId, aggregated) {
  if (!ai) throw new Error('GROQ_API_KEY or OPENAI_API_KEY is required for AI narrative.');

  const { player, coreData, understatData, marketData } = aggregated;
  const core = coreData?.player || coreData || {};
  const stats = coreData?.statistics?.[0] || {};
  const games = stats?.games || {};
  const understatSeasons = understatData?.seasons || understatData?.externalStats || [];
  const market = marketData || {};

  function latestStat(arr, key) {
    if (!Array.isArray(arr) || !arr.length) return 0;
    const v = arr[0][key] ?? arr.find((s) => s[key] != null)?.[key];
    return v != null ? Number(v) : 0;
  }
  const goals = stats?.goals ?? games?.goals ?? 0;
  const assists = stats?.assists ?? games?.assists ?? 0;
  const minutes = games?.minutes ?? 0;
  const xg = understatSeasons?.[0]?.xG ?? latestStat(understatSeasons, 'xG') ?? 0;
  const xa = understatSeasons?.[0]?.xA ?? latestStat(understatSeasons, 'xA') ?? 0;
  const minsPerGoal = goals > 0 && minutes > 0 ? Math.round(minutes / goals) : null;

  const completionPromise = ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an elite football analyst for STATIQ. Explain what a player's stats actually mean in plain language. Be specific, reference the numbers directly.
When the player is a midfielder or defender, lead with non-obvious contributions (e.g. ball recoveries, line-breaking passes) when you can. Where relevant, describe behavioral or tactical patterns. Write so the insight is quotable and specific enough for a video script. Never generic.`,
      },
      {
        role: 'user',
        content: `Analyze ${player?.name}'s season:
Goals: ${goals}, xG: ${xg}, gap: ${goals - xg}
Assists: ${assists}, xA: ${xa}
Minutes: ${minutes}, mins/goal: ${minsPerGoal ?? 'n/a'}
Position: ${player?.position ?? 'unknown'}

Return ONLY JSON:
{
  "bullets": ["3 findings, max 8 words each. First bullet: lead with non-obvious contribution when relevant."],
  "analysis": "2-3 sentences. Reference specific stats. Explain the xG gap. State whether form is sustainable."
}`,
      },
    ],
    max_tokens: 450,
  });

  const completion = await withTimeout(completionPromise, AI_TIMEOUT_MS, null);
  if (!completion) {
    throw new Error('Report generation timed out. Try again shortly.');
  }

  const rawContent = completion?.choices?.[0]?.message?.content?.trim() || '';
  
  // Parse bullet points and paragraph (same logic as generateAndCacheInsight)
  let bullets = [];
  let full_text = '';
  
  const bulletMatches = rawContent.match(/[•\-\*]\s*([^\n•\-\*]+)/g) || [];
  bullets = bulletMatches.slice(0, 3).map(b => b.replace(/^[•\-\*]\s*/, '').trim());
  
  const paragraphMatch = rawContent.match(/PARAGRAPH:\s*(.+)/is);
  if (paragraphMatch) {
    full_text = paragraphMatch[1].trim();
  } else {
    const sentences = rawContent.split(/(?<=[.!?])\s+/).filter(s => 
      !bulletMatches.some(b => b.includes(s.substring(0, 20)))
    );
    full_text = sentences.slice(0, 4).join(' ').trim();
  }
  
  if (bullets.length < 3) {
    const sentences = rawContent.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
    while (bullets.length < 3 && sentences.length > 0) {
      const sent = sentences.shift();
      if (!bullets.includes(sent)) {
        bullets.push(sent.replace(/^[•\-\*\d.]\s*/, '').trim());
      }
    }
  }
  
  if (bullets.length === 0) {
    bullets = ['Form data available in stats', 'Check xG/xA in external stats', 'Full analysis below'];
  }
  if (!full_text) {
    full_text = rawContent.substring(0, 400);
  }
  
  const summary_text = JSON.stringify({ bullets, full_text });

  const { data: report, error } = await supabase
    .from('insight_reports')
    .insert({ player_id: playerId, summary_text })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return { summary_text, report_id: report.id };
}

/**
 * Delete cached insight(s) for a player so the next getOrCreateInsight will regenerate from current DB stats.
 */
export async function deleteCachedInsight(playerId) {
  const { error } = await supabase
    .from('insight_reports')
    .delete()
    .eq('player_id', playerId);
  if (error) throw new Error(`Failed to delete cached insight: ${error.message}`);
}

/**
 * Get latest insight for a player; optionally generate.
 * Uses getUnifiedProfile so insight is always based on DB stats (real or auto-generated),
 * avoiding "0 minutes" for players who have no API-Sports/Understat data but do have profile stats.
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
    profile.stats,
    profile.externalStats
  );
  return { summary_text };
}

/**
 * Generate comparison narrative with verdict + sustainability (lucky vs due) for fantasy managers.
 * @param {object} player1 - { name } and stats
 * @param {object} player2 - { name } and stats
 * @param {object} deltas - e.g. { goals, assists, xg, xa }
 * @returns {Promise<{ narrative: string, verdict?: string, sustainability?: string, analysis?: string }>}
 */
export async function generateComparisonNarrative(player1, player2, deltas) {
  if (!ai) return { narrative: 'Comparison narrative unavailable (no AI provider configured).' };

  const s1 = player1.stats?.[0] || {};
  const s2 = player2.stats?.[0] || {};
  const g1 = s1.goals ?? 0, xg1 = Number(s1.xg ?? 0), a1 = s1.assists ?? 0, xa1 = Number(s1.xa ?? 0), m1 = s1.minutes_played ?? 0;
  const g2 = s2.goals ?? 0, xg2 = Number(s2.xg ?? 0), a2 = s2.assists ?? 0, xa2 = Number(s2.xa ?? 0), m2 = s2.minutes_played ?? 0;

  const completionPromise = ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an elite football analyst for STATIQ. Compare two players and give a direct verdict. Reference whether either player is overperforming their xG (lucky) or has high xG but low goals (due for a goal). This is the key insight for fantasy managers. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `${player1.name}: ${g1} goals, ${xg1} xG, gap ${g1 - xg1}, ${a1} assists, ${xa1} xA, ${m1} mins\n${player2.name}: ${g2} goals, ${xg2} xG, gap ${g2 - xg2}, ${a2} assists, ${xa2} xA, ${m2} mins\n\nReturn ONLY JSON:\n{"verdict": "One sentence. Name the better pick right now and why.", "sustainability": "One sentence. Who is lucky vs who is due.", "analysis": "2-3 sentences using the actual numbers. Direct."}`,
      },
    ],
    max_tokens: 280,
  });

  const completion = await withTimeout(completionPromise, AI_TIMEOUT_MS, null);
  if (!completion) return { narrative: 'Comparison narrative temporarily unavailable (timeout).' };
  const raw = completion?.choices?.[0]?.message?.content?.trim() || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const verdict = parsed.verdict || '';
      const sustainability = parsed.sustainability || '';
      const analysis = parsed.analysis || '';
      const narrative = [verdict, sustainability, analysis].filter(Boolean).join(' ');
      return { narrative, verdict, sustainability, analysis };
    } catch (_) {}
  }
  return { narrative: raw || 'No comparison narrative.' };
}
