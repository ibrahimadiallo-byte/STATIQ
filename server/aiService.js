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
    externalStats: externalSummary,
  };

  const completionPromise = ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a football scout. Write a brief scouting report.`,
      },
      {
        role: 'user',
        content: `Analyze this player: ${JSON.stringify(payload)}

Write EXACTLY this format:
• [5-10 word summary of form]
• [5-10 word key stat]
• [5-10 word outlook]

PARAGRAPH: [2-3 sentence detailed analysis]

IMPORTANT: Each bullet must be SHORT (under 12 words). Be concise.`,
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
  
  // Parse bullet points and paragraph
  let bullets = [];
  let full_text = '';
  
  // Extract bullets (look for • or - or numbered items)
  const bulletMatches = rawContent.match(/[•\-\*]\s*([^\n•\-\*]+)/g) || [];
  bullets = bulletMatches.slice(0, 3).map(b => b.replace(/^[•\-\*]\s*/, '').trim());
  
  // Extract paragraph (after "PARAGRAPH:" or take remaining text)
  const paragraphMatch = rawContent.match(/PARAGRAPH:\s*(.+)/is);
  if (paragraphMatch) {
    full_text = paragraphMatch[1].trim();
  } else {
    // Fallback: extract sentences not in bullets
    const sentences = rawContent.split(/(?<=[.!?])\s+/).filter(s => 
      !bulletMatches.some(b => b.includes(s.substring(0, 20)))
    );
    full_text = sentences.slice(0, 3).join(' ').trim();
  }
  
  // If we still don't have 3 bullets, generate from sentences
  if (bullets.length < 3) {
    const sentences = rawContent.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
    while (bullets.length < 3 && sentences.length > 0) {
      const sent = sentences.shift();
      if (!bullets.includes(sent)) {
        bullets.push(sent.replace(/^[•\-\*\d.]\s*/, '').trim());
      }
    }
  }
  
  // Ensure we have content
  if (bullets.length === 0) {
    bullets = ['Statistics available in profile', 'Review full analysis below', 'Check external stats for details'];
  }
  if (!full_text) {
    full_text = rawContent.substring(0, 300);
  }

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

  const payload = {
    name: player?.name,
    position: player?.position,
    team: player?.team_name,
    core: {
      goals: stats?.goals ?? games?.goals,
      assists: stats?.assists ?? games?.assists,
      minutes: games?.minutes,
      position: games?.position,
    },
    advanced: {
      xG_xA: Array.isArray(understatSeasons) ? understatSeasons.slice(0, 3) : understatSeasons,
      externalStats: understatData?.externalStats?.slice(0, 3) || [],
    },
    market: {
      value_eur: market.value_eur,
      value_history: market.value_history,
      brand_equity: market.brand_equity,
    },
  };

  const completionPromise = ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a clinical football scout. Write a brief scouting report.`,
      },
      {
        role: 'user',
        content: `Analyze this player: ${JSON.stringify(payload)}

Write EXACTLY this format:
• [5-10 word summary of current form]
• [5-10 word key stat highlight]
• [5-10 word assessment]

PARAGRAPH: [3-4 sentence detailed analysis]

IMPORTANT: Each bullet must be SHORT (under 12 words). No long sentences in bullets.`,
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
 * Get latest insight for a player; optionally generate using full multi-source narrative.
 * When generateIfMissing is true, uses getAggregatedPlayerData + generatePlayerReport.
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

  try {
    const { getAggregatedPlayerData } = await import('./playerService.js');
    const aggregated = await getAggregatedPlayerData(playerId);
    if (!aggregated) return null;
    const { summary_text } = await generatePlayerReport(playerId, aggregated);
    return { summary_text };
  } catch (e) {
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
}

/**
 * Generate a short AI narrative for a player comparison (PRD: comparison with AI-generated context).
 * @param {object} player1 - { name, ... } and optionally stats
 * @param {object} player2 - { name, ... } and optionally stats
 * @param {object} deltas - e.g. { goals, assists, xg, xa }
 * @returns {Promise<string>}
 */
export async function generateComparisonNarrative(player1, player2, deltas) {
  if (!ai) return 'Comparison narrative unavailable (no AI provider configured).';

  const completionPromise = ai.chat.completions.create({
    model: AI_MODEL,
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
