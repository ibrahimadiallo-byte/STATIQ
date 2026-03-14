/**
 * World Cup 2026 Static Data
 * Tournament: June 11 - July 19, 2026
 * Host: USA, Canada, Mexico
 * Format: 48 teams, 12 groups of 4
 * 
 * Groups drawn December 5, 2025.
 */

export const WORLD_CUP_2026 = {
  name: 'FIFA World Cup 2026',
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  hosts: ['USA', 'Canada', 'Mexico'],
  totalTeams: 48,
  format: '12 groups of 4, top 2 + best 8 third-place advance to Round of 32',
  
  groups: {
    A: {
      name: 'Group A',
      teams: [
        { name: 'Mexico', code: 'MEX', flag: '🇲🇽', confederation: 'CONCACAF' },
        { name: 'South Korea', code: 'KOR', flag: '🇰🇷', confederation: 'AFC' },
        { name: 'South Africa', code: 'RSA', flag: '🇿🇦', confederation: 'CAF' },
        { name: 'TBD (UEFA Playoff D)', code: 'TBD', flag: '🏳️', confederation: 'UEFA' },
      ],
    },
    B: {
      name: 'Group B',
      teams: [
        { name: 'Canada', code: 'CAN', flag: '🇨🇦', confederation: 'CONCACAF' },
        { name: 'Qatar', code: 'QAT', flag: '🇶🇦', confederation: 'AFC' },
        { name: 'Switzerland', code: 'SUI', flag: '🇨🇭', confederation: 'UEFA' },
        { name: 'TBD (UEFA Playoff A)', code: 'TBD', flag: '🏳️', confederation: 'UEFA' },
      ],
    },
    C: {
      name: 'Group C',
      teams: [
        { name: 'Brazil', code: 'BRA', flag: '🇧🇷', confederation: 'CONMEBOL' },
        { name: 'Morocco', code: 'MAR', flag: '🇲🇦', confederation: 'CAF' },
        { name: 'Scotland', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA' },
        { name: 'Haiti', code: 'HAI', flag: '🇭🇹', confederation: 'CONCACAF' },
      ],
    },
    D: {
      name: 'Group D',
      teams: [
        { name: 'United States', code: 'USA', flag: '🇺🇸', confederation: 'CONCACAF' },
        { name: 'Australia', code: 'AUS', flag: '🇦🇺', confederation: 'AFC' },
        { name: 'Paraguay', code: 'PAR', flag: '🇵🇾', confederation: 'CONMEBOL' },
        { name: 'TBD (UEFA Playoff C)', code: 'TBD', flag: '🏳️', confederation: 'UEFA' },
      ],
    },
    E: {
      name: 'Group E',
      teams: [
        { name: 'Germany', code: 'GER', flag: '🇩🇪', confederation: 'UEFA' },
        { name: 'Ecuador', code: 'ECU', flag: '🇪🇨', confederation: 'CONMEBOL' },
        { name: 'Ivory Coast', code: 'CIV', flag: '🇨🇮', confederation: 'CAF' },
        { name: 'Curaçao', code: 'CUW', flag: '🇨🇼', confederation: 'CONCACAF' },
      ],
    },
    F: {
      name: 'Group F',
      teams: [
        { name: 'Netherlands', code: 'NED', flag: '🇳🇱', confederation: 'UEFA' },
        { name: 'Japan', code: 'JPN', flag: '🇯🇵', confederation: 'AFC' },
        { name: 'Tunisia', code: 'TUN', flag: '🇹🇳', confederation: 'CAF' },
        { name: 'TBD (UEFA Playoff B)', code: 'TBD', flag: '🏳️', confederation: 'UEFA' },
      ],
    },
    G: {
      name: 'Group G',
      teams: [
        { name: 'Belgium', code: 'BEL', flag: '🇧🇪', confederation: 'UEFA' },
        { name: 'Iran', code: 'IRN', flag: '🇮🇷', confederation: 'AFC' },
        { name: 'Egypt', code: 'EGY', flag: '🇪🇬', confederation: 'CAF' },
        { name: 'New Zealand', code: 'NZL', flag: '🇳🇿', confederation: 'OFC' },
      ],
    },
    H: {
      name: 'Group H',
      teams: [
        { name: 'Spain', code: 'ESP', flag: '🇪🇸', confederation: 'UEFA' },
        { name: 'Uruguay', code: 'URU', flag: '🇺🇾', confederation: 'CONMEBOL' },
        { name: 'Saudi Arabia', code: 'KSA', flag: '🇸🇦', confederation: 'AFC' },
        { name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻', confederation: 'CAF' },
      ],
    },
    I: {
      name: 'Group I',
      teams: [
        { name: 'France', code: 'FRA', flag: '🇫🇷', confederation: 'UEFA' },
        { name: 'Senegal', code: 'SEN', flag: '🇸🇳', confederation: 'CAF' },
        { name: 'Norway', code: 'NOR', flag: '🇳🇴', confederation: 'UEFA' },
        { name: 'TBD (FIFA Playoff 2)', code: 'TBD', flag: '🏳️', confederation: 'TBD' },
      ],
    },
    J: {
      name: 'Group J',
      teams: [
        { name: 'Argentina', code: 'ARG', flag: '🇦🇷', confederation: 'CONMEBOL' },
        { name: 'Austria', code: 'AUT', flag: '🇦🇹', confederation: 'UEFA' },
        { name: 'Algeria', code: 'ALG', flag: '🇩🇿', confederation: 'CAF' },
        { name: 'Jordan', code: 'JOR', flag: '🇯🇴', confederation: 'AFC' },
      ],
    },
    K: {
      name: 'Group K',
      teams: [
        { name: 'Portugal', code: 'POR', flag: '🇵🇹', confederation: 'UEFA' },
        { name: 'Colombia', code: 'COL', flag: '🇨🇴', confederation: 'CONMEBOL' },
        { name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', confederation: 'AFC' },
        { name: 'TBD (FIFA Playoff 1)', code: 'TBD', flag: '🏳️', confederation: 'TBD' },
      ],
    },
    L: {
      name: 'Group L',
      teams: [
        { name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
        { name: 'Croatia', code: 'CRO', flag: '🇭🇷', confederation: 'UEFA' },
        { name: 'Panama', code: 'PAN', flag: '🇵🇦', confederation: 'CONCACAF' },
        { name: 'Ghana', code: 'GHA', flag: '🇬🇭', confederation: 'CAF' },
      ],
    },
  },

  hostCities: [
    { city: 'New York/New Jersey', country: 'USA', stadium: 'MetLife Stadium', capacity: 82500 },
    { city: 'Los Angeles', country: 'USA', stadium: 'SoFi Stadium', capacity: 70000 },
    { city: 'Dallas', country: 'USA', stadium: 'AT&T Stadium', capacity: 80000 },
    { city: 'Miami', country: 'USA', stadium: 'Hard Rock Stadium', capacity: 65326 },
    { city: 'Atlanta', country: 'USA', stadium: 'Mercedes-Benz Stadium', capacity: 71000 },
    { city: 'Houston', country: 'USA', stadium: 'NRG Stadium', capacity: 72220 },
    { city: 'Philadelphia', country: 'USA', stadium: 'Lincoln Financial Field', capacity: 69176 },
    { city: 'Seattle', country: 'USA', stadium: 'Lumen Field', capacity: 69000 },
    { city: 'San Francisco', country: 'USA', stadium: 'Levi\'s Stadium', capacity: 68500 },
    { city: 'Kansas City', country: 'USA', stadium: 'Arrowhead Stadium', capacity: 76416 },
    { city: 'Boston', country: 'USA', stadium: 'Gillette Stadium', capacity: 65878 },
    { city: 'Mexico City', country: 'Mexico', stadium: 'Estadio Azteca', capacity: 87000 },
    { city: 'Guadalajara', country: 'Mexico', stadium: 'Estadio Akron', capacity: 49850 },
    { city: 'Monterrey', country: 'Mexico', stadium: 'Estadio BBVA', capacity: 53500 },
    { city: 'Toronto', country: 'Canada', stadium: 'BMO Field', capacity: 45000 },
    { city: 'Vancouver', country: 'Canada', stadium: 'BC Place', capacity: 54500 },
  ],

  keyDates: [
    { date: '2026-06-11', event: 'Opening Match (Mexico City)' },
    { date: '2026-06-11', event: 'Group Stage Begins' },
    { date: '2026-06-26', event: 'Group Stage Ends' },
    { date: '2026-06-28', event: 'Round of 32 Begins' },
    { date: '2026-07-04', event: 'Round of 16 Begins' },
    { date: '2026-07-11', event: 'Quarter-Finals' },
    { date: '2026-07-14', event: 'Semi-Finals' },
    { date: '2026-07-18', event: 'Third Place Match' },
    { date: '2026-07-19', event: 'Final (New York/New Jersey)' },
  ],
};

/**
 * Get all groups with teams.
 */
export function getGroups() {
  return Object.entries(WORLD_CUP_2026.groups).map(([key, group]) => ({
    id: key,
    ...group,
  }));
}

/**
 * Get all qualified teams.
 */
export function getTeams() {
  const teams = [];
  for (const [groupId, group] of Object.entries(WORLD_CUP_2026.groups)) {
    for (const team of group.teams) {
      teams.push({ ...team, group: groupId });
    }
  }
  return teams;
}

/**
 * Get teams by confederation.
 */
export function getTeamsByConfederation(confederation) {
  return getTeams().filter((t) => t.confederation === confederation);
}

/**
 * Get tournament overview.
 */
export function getTournamentInfo() {
  return {
    name: WORLD_CUP_2026.name,
    startDate: WORLD_CUP_2026.startDate,
    endDate: WORLD_CUP_2026.endDate,
    hosts: WORLD_CUP_2026.hosts,
    totalTeams: WORLD_CUP_2026.totalTeams,
    format: WORLD_CUP_2026.format,
    keyDates: WORLD_CUP_2026.keyDates,
    hostCities: WORLD_CUP_2026.hostCities,
  };
}

/**
 * Get countdown to World Cup.
 */
export function getCountdown() {
  const start = new Date('2026-06-11T00:00:00Z');
  const now = new Date();
  const diff = start - now;
  
  if (diff <= 0) {
    return { started: true, daysUntil: 0, message: 'World Cup 2026 has started!' };
  }
  
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return {
    started: false,
    daysUntil: days,
    message: `${days} days until World Cup 2026 kicks off!`,
  };
}

/**
 * Check if a player's national team is in World Cup 2026.
 */
export function isPlayerInWorldCup(nationality) {
  const teams = getTeams();
  const normalizedNat = nationality?.toLowerCase().trim();
  
  const countryMappings = {
    'france': 'France',
    'french': 'France',
    'brazil': 'Brazil',
    'brazilian': 'Brazil',
    'argentina': 'Argentina',
    'argentinian': 'Argentina',
    'england': 'England',
    'english': 'England',
    'germany': 'Germany',
    'german': 'Germany',
    'spain': 'Spain',
    'spanish': 'Spain',
    'portugal': 'Portugal',
    'portuguese': 'Portugal',
    'netherlands': 'Netherlands',
    'dutch': 'Netherlands',
    'belgium': 'Belgium',
    'belgian': 'Belgium',
    'croatia': 'Croatia',
    'croatian': 'Croatia',
    'usa': 'United States',
    'united states': 'United States',
    'american': 'United States',
    'mexico': 'Mexico',
    'mexican': 'Mexico',
    'japan': 'Japan',
    'japanese': 'Japan',
    'south korea': 'South Korea',
    'korean': 'South Korea',
    'australia': 'Australia',
    'australian': 'Australia',
    'senegal': 'Senegal',
    'senegalese': 'Senegal',
    'morocco': 'Morocco',
    'moroccan': 'Morocco',
    'ghana': 'Ghana',
    'ghanaian': 'Ghana',
    'egypt': 'Egypt',
    'egyptian': 'Egypt',
    'iran': 'Iran',
    'iranian': 'Iran',
    'saudi arabia': 'Saudi Arabia',
    'saudi': 'Saudi Arabia',
    'qatar': 'Qatar',
    'qatari': 'Qatar',
    'uruguay': 'Uruguay',
    'uruguayan': 'Uruguay',
    'colombia': 'Colombia',
    'colombian': 'Colombia',
    'ecuador': 'Ecuador',
    'ecuadorian': 'Ecuador',
    'paraguay': 'Paraguay',
    'paraguayan': 'Paraguay',
  };

  const mappedCountry = countryMappings[normalizedNat] || nationality;
  const team = teams.find((t) => t.name.toLowerCase() === mappedCountry?.toLowerCase());
  
  return team ? { inWorldCup: true, team, group: team.group } : { inWorldCup: false };
}
