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
  minute?: number | null;
  group?: string;
  stage?: string;
};

type League = { code: string; name: string; country: string; flag: string };

const LEAGUES: League[] = [
  { code: "PL", name: "Premier League", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD", name: "La Liga", country: "Spain", flag: "🇪🇸" },
  { code: "BL1", name: "Bundesliga", country: "Germany", flag: "🇩🇪" },
  { code: "SA", name: "Serie A", country: "Italy", flag: "🇮🇹" },
  { code: "FL1", name: "Ligue 1", country: "France", flag: "🇫🇷" },
  { code: "CL", name: "Champions League", country: "Europe", flag: "🇪🇺" },
];

const FETCH_LIMIT = 20;

type Props = {
  onBack: () => void;
  onSearchPlayers?: () => void;
};

export function FixturesPage({ onBack, onSearchPlayers }: Props) {
  const [selectedLeague, setSelectedLeague] = useState<League>(LEAGUES[0]);
  const [leagueMatches, setLeagueMatches] = useState<Match[]>([]);
  const [wcMatches, setWcMatches] = useState<Match[]>([]);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [loadingWC, setLoadingWC] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setLoadingLeague(true);
    fetch(`/api/fixtures/league/${selectedLeague.code}?limit=${FETCH_LIMIT}`)
      .then((r) => r.json())
      .then((data) => {
        setLeagueMatches(data.matches || []);
        setLoadingLeague(false);
      })
      .catch(() => setLoadingLeague(false));
  }, [selectedLeague]);

  useEffect(() => {
    fetch(`/api/fixtures/world-cup?limit=${FETCH_LIMIT}`)
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
    if (date.toDateString() === now.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const isLive = (status: string) =>
    (status || "").toUpperCase() === "IN_PLAY" || (status || "").toUpperCase() === "LIVE";

  const validWc = wcMatches.filter((m) => (m.home || "").trim() && (m.away || "").trim());

  return (
    <section className="pb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 text-sm text-white/80 hover:text-white touch-manipulation"
        >
          <span aria-hidden>←</span> Back to Explore
        </button>
        {onSearchPlayers && (
          <button
            type="button"
            onClick={onSearchPlayers}
            className="min-h-[44px] px-4 rounded-xl bg-[#1520A6]/80 text-white text-sm font-medium touch-manipulation"
          >
            Search players
          </button>
        )}
      </div>

      <h1 className="text-xl font-bold tracking-tight">All fixtures</h1>
      <p className="mt-1 text-sm text-white/50">
        Upcoming matches by league and World Cup 2026. Data from Football-Data.org.
      </p>

      {/* League */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="min-h-[44px] flex items-center gap-2 bg-[#111730] rounded-xl px-3 py-2 touch-manipulation"
            >
              <span className="text-xl">{selectedLeague.flag}</span>
              <span className="font-semibold">{selectedLeague.name}</span>
              <svg className={`w-4 h-4 ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#111730] rounded-xl shadow-xl z-20 border border-white/10 max-h-64 overflow-y-auto">
                {LEAGUES.map((league) => (
                  <button
                    key={league.code}
                    type="button"
                    onClick={() => {
                      setSelectedLeague(league);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 min-h-[44px] ${
                      selectedLeague.code === league.code ? "bg-[#1520A6]/30" : ""
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
        </div>

        <div className="mt-4 space-y-3">
          {loadingLeague ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-[#111730] p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : leagueMatches.length === 0 ? (
            <p className="text-sm text-white/50 py-4">No upcoming matches for this league.</p>
          ) : (
            leagueMatches.map((match) => (
              <div key={match.id} className="rounded-2xl bg-[#111730] px-4 py-4 shadow-lg">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>Matchweek {match.matchday}</span>
                  <span>
                    {formatDate(match.date)} · {formatTime(match.date)}
                  </span>
                </div>
                {isLive(match.status) && (
                  <span className="text-xs text-red-400 mb-2 inline-block">
                    LIVE{match.minute != null ? ` ${match.minute}'` : ""}
                    {match.score && ` · ${match.score}`}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={match.homeCrest} alt="" className="h-9 w-9 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="font-semibold text-sm truncate">{match.home}</span>
                  </div>
                  <span className="text-white/40 text-xs px-2">vs</span>
                  <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
                    <img src={match.awayCrest} alt="" className="h-9 w-9 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="font-semibold text-sm truncate text-right">{match.away}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* World Cup */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🏆</span>
          <h2 className="text-lg font-semibold">FIFA World Cup 2026</h2>
        </div>
        <div className="space-y-3">
          {loadingWC ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-[#111730] p-4 h-20 animate-pulse border border-amber-500/10" />
              ))}
            </div>
          ) : validWc.length === 0 ? (
            <p className="text-sm text-white/50">No World Cup fixtures found.</p>
          ) : (
            validWc.map((match) => (
              <div key={match.id} className="rounded-2xl border border-amber-500/20 bg-[#111730] px-4 py-4">
                <div className="flex justify-between text-xs text-amber-400/90 mb-2">
                  <span>{match.group?.replace("GROUP_", "Group ") || match.stage}</span>
                  <span className="text-white/50">
                    {formatDate(match.date)} · {formatTime(match.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={match.homeCrest} alt="" className="h-9 w-9 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="font-semibold text-sm truncate">{match.home}</span>
                  </div>
                  <span className="text-white/40 text-xs">vs</span>
                  <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
                    <img src={match.awayCrest} alt="" className="h-9 w-9 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="font-semibold text-sm truncate text-right">{match.away}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
