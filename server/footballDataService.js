/**
 * Football-Data.org API Service - Real fixtures and standings
 * https://www.football-data.org/documentation/api
 */

import axios from 'axios';

const BASE_URL = 'https://api.football-data.org/v4';
const TIMEOUT_MS = 10000;

function getHeaders() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return null;
  return { 'X-Auth-Token': key };
}

/**
 * Available leagues on free tier
 */
export const LEAGUES = {
  PL: { code: 'PL', name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  BL1: { code: 'BL1', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪' },
  SA: { code: 'SA', name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
  PD: { code: 'PD', name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
  FL1: { code: 'FL1', name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
  CL: { code: 'CL', name: 'Champions League', country: 'Europe', flag: '🇪🇺' },
  WC: { code: 'WC', name: 'World Cup', country: 'World', flag: '🏆' },
};

/**
 * Get matches for any league
 */
export async function getLeagueMatches(leagueCode = 'PL', status = 'SCHEDULED', limit = 10) {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/competitions/${leagueCode}/matches`, {
      headers,
      timeout: TIMEOUT_MS,
      params: status ? { status } : {},
    });

    const league = LEAGUES[leagueCode] || { name: leagueCode };

    return (data.matches || []).slice(0, limit).map((m) => ({
      id: m.id,
      home: m.homeTeam.shortName || m.homeTeam.name,
      away: m.awayTeam.shortName || m.awayTeam.name,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      date: m.utcDate,
      status: m.status,
      matchday: m.matchday,
      stage: m.stage,
      group: m.group,
      venue: m.venue || 'TBD',
      minute: m.minute ?? m.score?.minute ?? null,
      score: m.score?.fullTime?.home != null
        ? `${m.score.fullTime.home} - ${m.score.fullTime.away}`
        : null,
      competition: league.name,
    }));
  } catch (err) {
    console.error(`[Football-Data] ${leagueCode} matches error:`, err.message);
    return [];
  }
}

/**
 * Get upcoming/recent Premier League matches (backward compatible)
 */
export async function getPremierLeagueMatches(status = 'SCHEDULED') {
  return getLeagueMatches('PL', status, 10);
}

/**
 * Get today's matches across competitions
 */
export async function getTodayMatches() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await axios.get(`${BASE_URL}/matches`, {
      headers,
      timeout: TIMEOUT_MS,
      params: { date: today },
    });

    return (data.matches || []).map((m) => ({
      id: m.id,
      home: m.homeTeam.shortName || m.homeTeam.name,
      away: m.awayTeam.shortName || m.awayTeam.name,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      date: m.utcDate,
      status: m.status,
      competition: m.competition.name,
      competitionEmblem: m.competition.emblem,
      score: m.score?.fullTime?.home != null 
        ? `${m.score.fullTime.home} - ${m.score.fullTime.away}`
        : null,
    }));
  } catch (err) {
    console.error('[Football-Data] Today matches error:', err.message);
    return [];
  }
}

/**
 * Get upcoming matches for next 7 days
 */
export async function getUpcomingMatches(days = 7) {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data } = await axios.get(`${BASE_URL}/matches`, {
      headers,
      timeout: TIMEOUT_MS,
      params: { dateFrom: from, dateTo: to },
    });

    return (data.matches || []).slice(0, 20).map((m) => ({
      id: m.id,
      home: m.homeTeam.shortName || m.homeTeam.name,
      away: m.awayTeam.shortName || m.awayTeam.name,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      date: m.utcDate,
      status: m.status,
      competition: m.competition.name,
      competitionCode: m.competition.code,
      competitionEmblem: m.competition.emblem,
      matchday: m.matchday,
    }));
  } catch (err) {
    console.error('[Football-Data] Upcoming matches error:', err.message);
    return [];
  }
}

/**
 * Get Premier League standings
 */
export async function getPremierLeagueStandings() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/competitions/PL/standings`, {
      headers,
      timeout: TIMEOUT_MS,
    });

    const table = data.standings?.find((s) => s.type === 'TOTAL')?.table || [];
    return table.map((t) => ({
      position: t.position,
      team: t.team.shortName || t.team.name,
      crest: t.team.crest,
      played: t.playedGames,
      won: t.won,
      draw: t.draw,
      lost: t.lost,
      gf: t.goalsFor,
      ga: t.goalsAgainst,
      gd: t.goalDifference,
      points: t.points,
    }));
  } catch (err) {
    console.error('[Football-Data] Standings error:', err.message);
    return [];
  }
}

/**
 * Get World Cup 2026 matches
 */
export async function getWorldCupMatches(limit = 10) {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/competitions/WC/matches`, {
      headers,
      timeout: TIMEOUT_MS,
    });

    return (data.matches || []).slice(0, limit).map((m) => ({
      id: m.id,
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      homeShort: m.homeTeam.tla,
      awayShort: m.awayTeam.tla,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      date: m.utcDate,
      status: m.status,
      matchday: m.matchday,
      stage: m.stage,
      group: m.group,
      score: m.score?.fullTime?.home != null 
        ? `${m.score.fullTime.home} - ${m.score.fullTime.away}`
        : null,
      competition: 'FIFA World Cup 2026',
    }));
  } catch (err) {
    console.error('[Football-Data] World Cup matches error:', err.message);
    return [];
  }
}

/**
 * Get World Cup 2026 groups/standings
 */
export async function getWorldCupStandings() {
  const headers = getHeaders();
  if (!headers) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/competitions/WC/standings`, {
      headers,
      timeout: TIMEOUT_MS,
    });

    return (data.standings || []).map((group) => ({
      group: group.group,
      table: group.table.map((t) => ({
        position: t.position,
        team: t.team.name,
        shortName: t.team.tla,
        crest: t.team.crest,
        played: t.playedGames,
        won: t.won,
        draw: t.draw,
        lost: t.lost,
        gf: t.goalsFor,
        ga: t.goalsAgainst,
        gd: t.goalDifference,
        points: t.points,
      })),
    }));
  } catch (err) {
    console.error('[Football-Data] World Cup standings error:', err.message);
    return [];
  }
}

export function isAvailable() {
  return !!process.env.FOOTBALL_DATA_API_KEY;
}
