import { useEffect, useState } from "react";

type Match = {
  id: number;
  home: string;
  away: string;
  homeCrest: string;
  awayCrest: string;
  date: string;
  status: string;
  matchday: number;
  competition: string;
  score: string | null;
  group?: string;
  stage?: string;
};

type League = {
  code: string;
  name: string;
  country: string;
  flag: string;
};

const LEAGUES: League[] = [
  { code: 'PL', name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD', name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪' },
  { code: 'SA', name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
  { code: 'CL', name: 'Champions League', country: 'Europe', flag: '🇪🇺' },
];

export function ExplorePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>(LEAGUES[0]);
  const [leagueMatches, setLeagueMatches] = useState<Match[]>([]);
  const [wcMatches, setWcMatches] = useState<Match[]>([]);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [loadingWC, setLoadingWC] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch selected league
    setLoadingLeague(true);
    fetch(`/api/fixtures/league/${selectedLeague.code}?limit=6`)
      .then((r) => r.json())
      .then((data) => {
        setLeagueMatches(data.matches || []);
        setLoadingLeague(false);
      })
      .catch(() => setLoadingLeague(false));
  }, [selectedLeague]);

  useEffect(() => {
    // Fetch World Cup
    fetch("/api/fixtures/world-cup?limit=4")
      .then((r) => r.json())
      .then((data) => {
        setWcMatches(data.matches || []);
        setLoadingWC(false);
      })
      .catch(() => setLoadingWC(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  return (
    <section className="pb-6">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#1b2a7a] via-[#1520A6] to-[#4f6bff] p-5 md:p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <span className="text-lg">⚽</span>
          </div>
          <span className="uppercase tracking-[0.25em] text-[11px]">
            Live Fixtures
          </span>
        </div>
        <div className="mt-6">
          <p className="text-3xl font-semibold italic tracking-wide leading-none">
            WORLD CUP
          </p>
          <p className="text-4xl font-black italic tracking-wide leading-none">
            2026
          </p>
          <p className="text-2xl font-black italic tracking-wide text-white/70 leading-none">
            USA · CANADA · MEXICO
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/70">
            June 11 - July 19, 2026 · 48 Teams
          </p>
        </div>
      </section>

      {/* League Matches - With Dropdown Selector */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-[#111730] rounded-xl px-3 py-2 hover:bg-[#1a2040] transition"
            >
              <span className="text-xl">{selectedLeague.flag}</span>
              <span className="font-semibold">{selectedLeague.name}</span>
              <svg className={`w-4 h-4 transition ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#111730] rounded-xl shadow-xl z-20 border border-white/10 overflow-hidden">
                {LEAGUES.map((league) => (
                  <button
                    key={league.code}
                    onClick={() => {
                      setSelectedLeague(league);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition ${
                      selectedLeague.code === league.code ? 'bg-[#1520A6]/30' : ''
                    }`}
                  >
                    <span className="text-xl">{league.flag}</span>
                    <div>
                      <p className="font-medium text-sm">{league.name}</p>
                      <p className="text-xs text-white/50">{league.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs uppercase tracking-[0.15em] text-emerald-400 font-medium">
            Live Data
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {loadingLeague ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-[#111730] p-5 animate-pulse">
                  <div className="h-16 bg-white/5 rounded"></div>
                </div>
              ))}
            </div>
          ) : leagueMatches.length === 0 ? (
            <div className="rounded-2xl bg-[#111730] p-5 text-center text-white/50 text-sm">
              No upcoming matches found
            </div>
          ) : (
            leagueMatches.map((match) => (
              <div
                key={match.id}
                className={`rounded-2xl px-4 py-4 md:px-5 md:py-5 shadow-lg ${
                  isToday(match.date)
                    ? "bg-gradient-to-r from-[#111730] to-[#1a2840] border border-emerald-500/30"
                    : "bg-[#111730]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded font-medium">
                      Matchweek {match.matchday}
                    </span>
                    {isToday(match.date) && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${isToday(match.date) ? "text-emerald-400" : "text-white/50"}`}>
                    {formatDate(match.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={match.homeCrest}
                      alt={match.home}
                      className="h-10 w-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <p className="text-base font-semibold uppercase tracking-wide">
                      {match.home}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs text-white/50 uppercase tracking-wider">vs</p>
                    <p className="text-xs text-white/70 mt-1">{formatTime(match.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold uppercase tracking-wide text-right">
                      {match.away}
                    </p>
                    <img
                      src={match.awayCrest}
                      alt={match.away}
                      className="h-10 w-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* World Cup 2026 Matches - REAL DATA */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <p className="text-lg font-semibold">FIFA World Cup 2026</p>
          </div>
          <span className="text-xs uppercase tracking-[0.15em] text-amber-400 font-medium">
            Live Data
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {loadingWC ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-[#111730] p-5 animate-pulse">
                  <div className="h-16 bg-white/5 rounded"></div>
                </div>
              ))}
            </div>
          ) : wcMatches.length === 0 ? (
            <div className="rounded-2xl bg-[#111730] p-5 text-center text-white/50 text-sm">
              No World Cup matches found
            </div>
          ) : (
            wcMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl bg-gradient-to-r from-[#111730] to-[#1a1f3d] px-4 py-4 md:px-5 md:py-5 shadow-lg border border-amber-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-amber-400 font-medium">
                    {match.group?.replace('GROUP_', 'Group ') || match.stage}
                  </span>
                  <span className="text-xs text-white/50">{formatDate(match.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={match.homeCrest}
                      alt={match.home}
                      className="h-10 w-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <p className="text-base font-semibold uppercase tracking-wide">
                      {match.home}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs text-white/50 uppercase tracking-wider">vs</p>
                    <p className="text-xs text-white/70 mt-1">{formatTime(match.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold uppercase tracking-wide text-right">
                      {match.away}
                    </p>
                    <img
                      src={match.awayCrest}
                      alt={match.away}
                      className="h-10 w-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Players to Watch */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Players to Watch</p>
          <span className="text-xs uppercase tracking-[0.15em] text-white/50">
            World Cup 2026
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Mbappé", team: "France", stat: "28 Goals", flag: "🇫🇷" },
            { name: "Haaland", team: "Norway", stat: "32 Goals", flag: "🇳🇴" },
            { name: "Vinicius Jr", team: "Brazil", stat: "18 Goals", flag: "🇧🇷" },
            { name: "Bellingham", team: "England", stat: "15 Goals", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
          ].map((player) => (
            <div
              key={player.name}
              className="rounded-2xl bg-[#0f152d] p-4 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{player.flag}</span>
                <div>
                  <p className="text-sm font-semibold">{player.name}</p>
                  <p className="text-xs text-white/50">{player.team}</p>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <span className="text-white/50">2025-26</span>
                <span className="text-emerald-400 font-semibold">{player.stat}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Source */}
      <div className="mt-6 text-center">
        <p className="text-xs text-white/30">
          Premier League data from Football-Data.org
        </p>
      </div>
    </section>
  );
}
