/**
 * Enetpulse World Cup 2026 Tracker logic.
 *
 * Fetches real-time tournament progress for Group Stage and identifies
 * "Momentum Spike" teams based on goals and VAR decisions. Exposes
 * whether a player's performance is contributing to a momentum spike.
 *
 * Data source: uses existing World Cup API (standings, fixtures, fixture events).
 * Optional: can be wired to Enetpulse API when ENETPULSE_* env is set.
 */

import {
  getWorldCupStandings,
  getWorldCupFixtures,
  getWorldCupTeams,
  getFixtureEvents,
} from './rapidApiService.js';

const WORLD_CUP_LEAGUE_ID = parseInt(process.env.WORLD_CUP_LEAGUE_ID || '1', 10) || 1;
const WORLD_CUP_SEASON = parseInt(process.env.WORLD_CUP_SEASON || '2026', 10) || 2026;

/** How many recent fixtures to consider for momentum (goals + VAR). */
const MOMENTUM_LOOKBACK_FIXTURES = 3;

/** Minimum goal-delta or VAR-in-favor count to label as Momentum Spike. */
const MOMENTUM_GOAL_DELTA_THRESHOLD = 1;
const MOMENTUM_VAR_CONTRIBUTION = true; // VAR in favor counts toward spike

/**
 * Fetch real-time Group Stage progress: standings by group + recent fixtures.
 * @param {number} [leagueId]
 * @param {number} [season]
 * @returns {Promise<{ groups: Array<{ name: string, teams: object[] }>, recentFixtures: object[], lastUpdated: string } | null>}
 */
export async function fetchWorldCupGroupStageProgress(leagueId = WORLD_CUP_LEAGUE_ID, season = WORLD_CUP_SEASON) {
  try {
    const [standingsRaw, fixturesRaw] = await Promise.all([
      getWorldCupStandings(leagueId, season),
      getWorldCupFixtures(leagueId, season, 20),
    ]);

    const groups = normalizeStandingsToGroups(standingsRaw);
    const recentFixtures = Array.isArray(fixturesRaw) ? fixturesRaw.slice(0, 24) : [];

    return {
      groups,
      recentFixtures,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    return null;
  }
}

function normalizeStandingsToGroups(standingsRaw) {
  if (!standingsRaw) return [];
  const arr = Array.isArray(standingsRaw) ? standingsRaw : [standingsRaw];
  const groups = [];

  for (const item of arr) {
    const league = item.league || item;
    const standings = league.standings;
    if (!Array.isArray(standings)) continue;
    for (let g = 0; g < standings.length; g++) {
      const rows = standings[g];
      const groupName = (league.name && String(league.name)) || `Group ${String.fromCharCode(65 + g)}`;
      const teams = Array.isArray(rows) ? rows.map((r) => ({
        rank: r.rank,
        teamId: r.team?.id,
        teamName: r.team?.name,
        points: r.points,
        goalsFor: r.all?.goals?.for ?? r.goals?.for,
        goalsAgainst: r.all?.goals?.against ?? r.goals?.against,
      })) : [];
      groups.push({ name: groupName, teams });
    }
  }
  return groups;
}

/**
 * Fetch fixture events (goals, VAR) for a list of fixture ids. Used for momentum calculation.
 * @param {number[]} fixtureIds
 * @returns {Promise<Map<number, object[]>>} fixtureId -> events[]
 */
async function fetchEventsForFixtures(fixtureIds) {
  const map = new Map();
  for (const id of fixtureIds) {
    try {
      const events = await getFixtureEvents(id);
      map.set(id, Array.isArray(events) ? events : []);
    } catch {
      map.set(id, []);
    }
  }
  return map;
}

/**
 * Compute which teams have a "Momentum Spike" from recent goals and VAR decisions.
 * Momentum = positive goal delta in recent fixtures and/or VAR decisions in favor (e.g. penalty scored, goal after VAR).
 *
 * @param {object[]} recentFixtures - API fixture objects (with fixture.id, teams.home, teams.away, goals)
 * @param {Map<number, object[]>} [fixtureEvents] - optional map fixtureId -> events (for VAR)
 * @returns {{ momentumSpikeTeamIds: Set<number>, momentumSpikeTeamNames: Set<string>, details: object[] }}
 */
export function computeMomentumSpikeTeams(recentFixtures, fixtureEvents = new Map()) {
  const momentumSpikeTeamIds = new Set();
  const momentumSpikeTeamNames = new Set();
  const details = [];

  if (!Array.isArray(recentFixtures) || recentFixtures.length === 0) {
    return { momentumSpikeTeamIds, momentumSpikeTeamNames, details };
  }

  const recent = recentFixtures.slice(0, MOMENTUM_LOOKBACK_FIXTURES * 2);
  const teamGoalDelta = new Map();
  const teamVarInFavor = new Map();

  for (const f of recent) {
    const fixtureId = f.fixture?.id ?? f.id;
    const homeId = f.teams?.home?.id ?? f.teams?.home?.id;
    const awayId = f.teams?.away?.id ?? f.teams?.away?.id;
    const homeName = f.teams?.home?.name ?? f.teams?.home?.name ?? '';
    const awayName = f.teams?.away?.name ?? f.teams?.away?.name ?? '';
    const goalsHome = f.goals?.home ?? f.score?.fulltime?.home ?? 0;
    const goalsAway = f.goals?.away ?? f.score?.fulltime?.away ?? 0;

    const hId = homeId != null ? Number(homeId) : null;
    const aId = awayId != null ? Number(awayId) : null;

    if (hId != null) {
      const cur = teamGoalDelta.get(hId) || 0;
      teamGoalDelta.set(hId, cur + (Number(goalsHome) || 0) - (Number(goalsAway) || 0));
    }
    if (aId != null) {
      const cur = teamGoalDelta.get(aId) || 0;
      teamGoalDelta.set(aId, cur + (Number(goalsAway) || 0) - (Number(goalsHome) || 0));
    }

    const events = fixtureEvents.get(fixtureId) || [];
    for (const ev of events) {
      const type = (ev.type || ev.detail || '').toLowerCase();
      const isVar = type.includes('var') || type.includes('video');
      const teamId = ev.team?.id != null ? Number(ev.team.id) : null;
      const isGoal = (ev.detail || ev.type || '').toLowerCase().includes('goal') || ev.type === 'Goal';
      if (isVar && isGoal && teamId != null) {
        teamVarInFavor.set(teamId, (teamVarInFavor.get(teamId) || 0) + 1);
      }
    }
  }

  for (const [teamId, delta] of teamGoalDelta) {
    const varBonus = MOMENTUM_VAR_CONTRIBUTION ? (teamVarInFavor.get(teamId) || 0) : 0;
    if (delta >= MOMENTUM_GOAL_DELTA_THRESHOLD || varBonus > 0) {
      momentumSpikeTeamIds.add(teamId);
      details.push({ teamId, goalDelta: delta, varInFavor: teamVarInFavor.get(teamId) || 0 });
    }
  }

  const teamIdToName = new Map();
  for (const f of recent) {
    const homeId = f.teams?.home?.id ?? f.teams?.home?.id;
    const awayId = f.teams?.away?.id ?? f.teams?.away?.id;
    if (homeId != null && f.teams?.home?.name) teamIdToName.set(Number(homeId), f.teams.home.name);
    if (awayId != null && f.teams?.away?.name) teamIdToName.set(Number(awayId), f.teams.away.name);
  }
  for (const teamId of momentumSpikeTeamIds) {
    const name = teamIdToName.get(teamId);
    if (name) momentumSpikeTeamNames.add(name);
  }

  return { momentumSpikeTeamIds, momentumSpikeTeamNames, details };
}

/**
 * Fetches Group Stage progress and computes Momentum Spike teams (goals + VAR).
 * @returns {Promise<{ progress: object | null, momentumSpikeTeamIds: number[], momentumSpikeTeamNames: string[], lastUpdated: string }>}
 */
export async function fetchWorldCupTrackerWithMomentum(leagueId = WORLD_CUP_LEAGUE_ID, season = WORLD_CUP_SEASON) {
  const progress = await fetchWorldCupGroupStageProgress(leagueId, season);
  if (!progress || !progress.recentFixtures?.length) {
    return {
      progress,
      momentumSpikeTeamIds: [],
      momentumSpikeTeamNames: [],
      momentumDetails: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  const fixtureIds = progress.recentFixtures
    .map((f) => f.fixture?.id ?? f.id)
    .filter((id) => id != null);
  const fixtureEvents = await fetchEventsForFixtures(fixtureIds);
  const { momentumSpikeTeamIds, momentumSpikeTeamNames, details } = computeMomentumSpikeTeams(
    progress.recentFixtures,
    fixtureEvents
  );

  return {
    progress: {
      groups: progress.groups,
      recentFixtures: progress.recentFixtures,
    },
    momentumSpikeTeamIds: Array.from(momentumSpikeTeamIds),
    momentumSpikeTeamNames: Array.from(momentumSpikeTeamNames),
    momentumDetails: details,
    lastUpdated: progress.lastUpdated,
  };
}

/**
 * Identifies if a player's performance is contributing to a Momentum Spike:
 * their team (or national team name) is in the current momentum spike set.
 *
 * @param {object} player - { team_name?: string, name?: string } (our player row or API player)
 * @param {{ momentumSpikeTeamNames: string[], momentumSpikeTeamIds: number[] }} [trackerSnapshot] - from fetchWorldCupTrackerWithMomentum; if omitted, fetches live
 * @returns {Promise<{ contributing: boolean, teamName?: string, momentumSpikeTeamNames: string[] }>}
 */
export async function isPlayerContributingToMomentumSpike(player, trackerSnapshot = null) {
  const snapshot = trackerSnapshot || await fetchWorldCupTrackerWithMomentum();
  const names = snapshot.momentumSpikeTeamNames || [];
  const teamName = player?.team_name || player?.team?.name || '';

  const contributing = teamName && names.some((n) => 
    String(n).toLowerCase() === String(teamName).toLowerCase() ||
    String(teamName).toLowerCase().includes(String(n).toLowerCase())
  );

  return {
    contributing: !!contributing,
    teamName: teamName || undefined,
    momentumSpikeTeamNames: names,
  };
}
