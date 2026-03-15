import { useEffect, useState, useCallback, useRef } from "react";
import { searchPlayers, type SearchResponse, type Player } from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

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

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

type ExplorePageProps = {
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  onGoToSearch?: (query?: string) => void;
  onViewAllFixtures?: () => void;
  onSelectPlayer?: (playerId: string, playerName?: string) => void;
};

export function ExplorePage({
  searchQuery = "",
  onSearchQueryChange,
  onGoToSearch,
  onViewAllFixtures,
  onSelectPlayer,
}: ExplorePageProps) {
  const [selectedLeague, setSelectedLeague] = useState<League>(LEAGUES[0]);
  const [leagueMatches, setLeagueMatches] = useState<Match[]>([]);
  const [wcMatches, setWcMatches] = useState<Match[]>([]);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [loadingWC, setLoadingWC] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(localSearch.trim(), 280);

  const runSearch = useCallback(async (signal: AbortSignal) => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data: SearchResponse = await searchPlayers(debouncedSearch, { signal });
      if (!signal.aborted) setSearchResults(data.candidates ?? []);
    } catch {
      if (!signal.aborted) setSearchResults([]);
    } finally {
      if (!signal.aborted) setSearchLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    runSearch(controller.signal);
    return () => controller.abort();
  }, [runSearch]);

  useEffect(() => {
    if (localSearch.trim()) setShowSearchDropdown(true);
  }, [localSearch, searchResults, searchLoading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      )
        setShowSearchDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlayer = (player: Player) => {
    if (onSelectPlayer) {
      onSelectPlayer(player.id, player.name);
      setLocalSearch("");
      onSearchQueryChange?.("");
      setSearchResults([]);
      setShowSearchDropdown(false);
    } else if (onGoToSearch) {
      onSearchQueryChange?.(player.name);
      onGoToSearch(player.name);
    }
  };

  useEffect(() => {
    setLoadingLeague(true);
    fetch(`/api/fixtures/league/${selectedLeague.code}?limit=3`)
      .then((r) => r.json())
      .then((data) => {
        setLeagueMatches(data.matches || []);
        setLoadingLeague(false);
      })
      .catch(() => setLoadingLeague(false));
  }, [selectedLeague]);

  useEffect(() => {
    fetch("/api/fixtures/world-cup?limit=3")
      .then((r) => r.json())
      .then((data) => {
        setWcMatches(data.matches || []);
        setLoadingWC(false);
      })
      .catch(() => setLoadingWC(false));
  }, []);

  /** Retention: auto-refresh fixtures every 60s */
  useEffect(() => {
    const t = setInterval(() => {
      fetch(`/api/fixtures/league/${selectedLeague.code}?limit=3`)
        .then((r) => r.json())
        .then((data) => setLeagueMatches(data.matches || []))
        .catch(() => {});
      fetch("/api/fixtures/world-cup?limit=3")
        .then((r) => r.json())
        .then((data) => setWcMatches(data.matches || []))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, [selectedLeague]);

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

  /** Days until match (for "Next match in X days") */
  const daysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  };

  const isLive = (status: string) => (status || "").toUpperCase() === "IN_PLAY" || (status || "").toUpperCase() === "LIVE";

  /** Hide World Cup cards with blank opponent names */
  const validWcMatches = wcMatches.filter((m) => (m.home || "").trim() && (m.away || "").trim());

  return (
    <section className="pb-6">
      {/* Adoption: Search above the fold on Explore — typeahead like Search tab */}
      {(onGoToSearch || onSelectPlayer) && (
        <div className="mb-4 relative" ref={searchDropdownRef}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (localSearch || "").trim();
              if (onSearchQueryChange) onSearchQueryChange(q);
              if (onGoToSearch) onGoToSearch(q);
            }}
            className="flex gap-2"
          >
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => localSearch.trim() && setShowSearchDropdown(true)}
              placeholder="Search any player..."
              className="flex-1 min-h-[44px] rounded-2xl bg-[#111730] border border-white/10 px-4 text-white placeholder:text-white/40 text-base focus:outline-none focus:ring-2 focus:ring-[#1520A6] touch-manipulation"
              style={{ fontSize: "16px" }}
              aria-label="Search players"
            />
            <button
              type="submit"
              className="min-w-[44px] min-h-[44px] rounded-2xl bg-[#1520A6] flex items-center justify-center text-white touch-manipulation"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {showSearchDropdown && localSearch.trim() && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-72 overflow-auto rounded-2xl bg-[#0f152d] shadow-xl border border-white/10">
              {searchLoading && (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <ul className="py-1">
                  {searchResults.map((player) => (
                    <li key={player.id}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition"
                        onClick={() => handleSelectPlayer(player)}
                      >
                        <PlayerAvatar
                          src={player.photo_url}
                          name={player.name}
                          className="h-10 w-10 rounded-xl bg-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{player.name}</p>
                          <p className="text-xs text-white/60 truncate">
                            {player.team_name ?? "—"} · {player.position ?? "—"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!searchLoading && searchResults.length === 0 && debouncedSearch.length >= 2 && (
                <div className="p-4 text-sm text-white/60">
                  No players found. Try full surname (e.g. Mbappe, Bellingham).
                </div>
              )}
              {!searchLoading && localSearch.trim().length > 0 && localSearch.trim().length < 2 && (
                <div className="p-4 text-sm text-white/60">
                  Type at least 2 characters to see suggestions.
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                    {isLive(match.status) && (
                      <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        LIVE{match.minute != null ? ` ${match.minute}'` : ""}
                      </span>
                    )}
                    {isToday(match.date) && !isLive(match.status) && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        TODAY
                      </span>
                    )}
                    {!isToday(match.date) && !isLive(match.status) && (() => {
                      const days = daysUntil(match.date);
                      if (days === 1) return <span className="text-xs text-white/60">Tomorrow</span>;
                      if (days > 0 && days <= 31) return <span className="text-xs text-white/60">Next match in {days} days</span>;
                      return null;
                    })()}
                  </div>
                  <span className={`text-xs ${isToday(match.date) || isLive(match.status) ? "text-emerald-400" : "text-white/50"}`}>
                    {formatDate(match.date)} · {formatTime(match.date)}
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
          ) : validWcMatches.length === 0 ? (
            <div className="rounded-2xl bg-[#111730] p-5 text-center text-white/50 text-sm">
              No World Cup matches found
            </div>
          ) : (
            validWcMatches.map((match) => (
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

      {onViewAllFixtures && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onViewAllFixtures}
            className="min-h-[44px] w-full max-w-sm rounded-2xl border border-white/15 bg-[#111730]/80 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-[#1520A6]/20 hover:border-emerald-500/30 transition touch-manipulation"
          >
            View all fixtures →
          </button>
        </div>
      )}

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
    </section>
  );
}
