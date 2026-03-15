import { useEffect, useState, useCallback, useRef } from "react";
import { searchPlayers, getPlayerProfile, type SearchResponse, type Player, type ProfileResponse } from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

type SearchPageProps = {
  query: string;
  onQueryChange: (value: string) => void;
  initialPlayerId?: string | null;
  onClearSelection?: () => void;
  onCompareWithAnother?: (playerId: string) => void;
};

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function SearchPage({
  query,
  onQueryChange,
  initialPlayerId,
  onClearSelection,
  onCompareWithAnother,
}: SearchPageProps) {
  const [results, setResults] = useState<Player[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 280);

  // When navigating from Explore with a player selected, show that player's profile on Search
  useEffect(() => {
    if (!initialPlayerId) {
      setSelectedPlayerId(null);
      setProfileData(null);
      return;
    }
    setSelectedPlayerId(initialPlayerId);
    setProfileData(null);
    setProfileLoading(true);
    getPlayerProfile(initialPlayerId)
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  }, [initialPlayerId]);

  const runSearch = useCallback(async (signal: AbortSignal) => {
    if (!debouncedQuery) {
      setResults([]);
      setSuggestions([]);
      setErrorMessage(null);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data: SearchResponse = await searchPlayers(debouncedQuery, { signal });
      if (!signal.aborted) {
        setResults(data.candidates ?? []);
        setSuggestions(data.suggestions ?? []);
      }
    } catch (err) {
      if (!signal.aborted) {
        const msg =
          err instanceof Error ? err.message : String(err) || "Something went wrong. Please try again.";
        setErrorMessage(msg);
        setResults([]);
        setSuggestions([]);
      }
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    runSearch(controller.signal);
    return () => controller.abort();
  }, [runSearch]);

  useEffect(() => {
    if (query.trim()) setShowDropdown(true);
  }, [query, results, isLoading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasError = errorMessage != null;
  const showEmpty =
    !isLoading && !hasError && results.length === 0 && debouncedQuery.length > 0;
  const queryTooShort = (query.trim().length > 0 && query.trim().length < 2);
  const showShortHint = showEmpty && queryTooShort;
  const displayQuery = (query.trim() || debouncedQuery).slice(0, 50);

  const handleSelect = (player: Player) => {
    setSelectedPlayerId(player.id);
    setResults([]);
    setShowDropdown(false);
    setProfileData(null);
    setProfileLoading(true);
    getPlayerProfile(player.id)
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  };

  const handleSearchAgain = () => {
    setSelectedPlayerId(null);
    setProfileData(null);
    onQueryChange("");
    onClearSelection?.();
    inputRef.current?.focus();
  };

  return (
    <section className="pb-6">
      <div className="rounded-2xl bg-[#111730] p-4 md:p-5 shadow-lg">
        <label className="text-xs uppercase tracking-[0.25em] text-white/60">
          Search players
        </label>
        <div className="mt-3 relative" ref={dropdownRef}>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 min-h-[44px]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1520A6] flex-shrink-0" />
            <input
              ref={inputRef}
              type="search"
              className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none touch-manipulation"
              style={{ fontSize: "16px" }}
              placeholder="Type to search (e.g. Bellingham, Mbappe)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
              aria-label="Search players"
            />
          </div>

          {showDropdown && query.trim() && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-72 overflow-auto rounded-2xl bg-[#0f152d] shadow-xl border border-white/10">
              {isLoading && (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}
              {!isLoading && hasError && (
                <div className="p-4 text-sm text-white/80">
                  <p>{errorMessage}</p>
                  <p className="mt-1 text-white/50 text-xs">
                    Try a full surname (e.g. Bellingham, Mbappe). If this is the live site, check that API keys are set in Vercel.
                  </p>
                </div>
              )}
              {!isLoading && !hasError && results.length > 0 && (
                <ul className="py-1">
                  {results.map((player) => (
                    <li key={player.id}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition"
                        onClick={() => handleSelect(player)}
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
              {!isLoading && !hasError && showEmpty && (
                <div className="p-4 text-sm text-white/60">
                  {showShortHint ? (
                    <>Type at least 2 characters to search (e.g. Mbappe, Salah, Ronaldo).</>
                  ) : (
                    <>
                      <p>No players found for &quot;{displayQuery}&quot;.</p>
                      {suggestions.length > 0 && (
                        <>
                          <p className="mt-2 text-white/80">Try:</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                          {suggestions.map((name) => (
                            <button
                              key={name}
                              type="button"
                              className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-[#1520A6]/40 text-white font-medium touch-manipulation"
                              onClick={() => {
                                onQueryChange(name);
                                setShowDropdown(true);
                              }}
                            >
                              {name}
                            </button>
                          ))}
                          </div>
                        </>
                      )}
                      {suggestions.length === 0 && <p className="mt-1">Try a full surname or another spelling.</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline profile when a player is selected — stay on Search tab */}
      {profileLoading && (
        <div className="mt-6 space-y-4">
          <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      )}
      {profileData && !profileLoading && (
        <InlineProfile
          profile={profileData}
          onSearchAgain={handleSearchAgain}
          onCompareWithAnother={selectedPlayerId ? () => onCompareWithAnother?.(selectedPlayerId) : undefined}
        />
      )}

      {!selectedPlayerId && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-lg font-semibold">Results</p>
          </div>

      {!showDropdown && isLoading && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!showDropdown && hasError && (
        <div className="mt-4 rounded-2xl bg-[#2b1630] px-4 py-5 text-sm text-white/80">
          <p>{errorMessage}</p>
        </div>
      )}

      {!showDropdown && showEmpty && (
        <div className="mt-4 rounded-2xl bg-white/5 px-4 py-5 text-sm text-white/70">
          {showShortHint ? (
            <>Type at least 2 characters to search (e.g. Mbappe, Salah, Ronaldo).</>
          ) : (
            <>
              <p>No players found for &quot;{displayQuery}&quot;.</p>
              {suggestions.length > 0 && (
                <>
                  <p className="mt-2 text-white/80">Try one of these:</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="min-h-[44px] px-4 rounded-xl bg-[#1520A6]/40 text-white font-medium touch-manipulation"
                        onClick={() => onQueryChange(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {suggestions.length === 0 && <p className="mt-1">Try a full surname or another spelling.</p>}
            </>
          )}
        </div>
      )}

      {!showDropdown && !isLoading && !hasError && results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((player) => (
            <button
              key={player.id}
              type="button"
              className="w-full rounded-2xl bg-[#0f152d] px-4 py-4 md:px-5 md:py-5 text-left shadow-lg transition hover:bg-[#1520A6]/20"
              onClick={() => handleSelect(player)}
            >
              <div className="flex items-center gap-4">
                <PlayerAvatar
                  src={player.photo_url}
                  name={player.name}
                  className="h-12 w-12 rounded-2xl bg-white/10"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{player.name}</p>
                  <p className="text-xs text-white/60">
                    {player.team_name ?? "—"} · {player.position ?? "—"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
        </>
      )}
    </section>
  );
}

function InlineProfile({
  profile,
  onSearchAgain,
  onCompareWithAnother,
}: {
  profile: ProfileResponse;
  onSearchAgain: () => void;
  onCompareWithAnother?: () => void;
}) {
  const { player, stats: rawStats, insight } = profile;
  const s = rawStats?.[0];
  const attackingStats = [
    { label: "Goals", value: s?.goals ?? "—", highlight: true },
    { label: "Assists", value: s?.assists ?? "—", highlight: true },
    { label: "xG", value: s?.xg != null ? s.xg.toFixed(2) : "—", highlight: false },
    { label: "xA", value: s?.xa != null ? s.xa.toFixed(2) : "—", highlight: false },
  ];
  let bullets: string[] = [];
  let fullText = "";
  if (insight?.summary_text) {
    const raw = insight.summary_text.trim();
    try {
      const parsed = JSON.parse(raw);
      bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
      fullText = (parsed.full_text || parsed.analysis || "").trim();
    } catch {
      const jsonBlock = raw.match(/\{[\s\S]*\}/);
      if (jsonBlock) {
        try {
          const p = JSON.parse(jsonBlock[0]);
          bullets = Array.isArray(p.bullets) ? p.bullets : [];
          fullText = (p.full_text || p.analysis || "").trim();
        } catch {
          fullText = raw.replace(/```[\s\S]*?```/g, "").trim();
          if (fullText.startsWith("{")) fullText = "";
        }
      } else {
        fullText = raw.replace(/```[\s\S]*?```/g, "").trim();
        if (fullText.startsWith("{")) fullText = "";
      }
    }
  }
  if (insight?.bullets?.length) bullets = insight.bullets;
  if (insight?.full_text) fullText = insight.full_text;

  const [expanded, setExpanded] = useState(false);
  const hasContent = bullets.length > 0 || fullText;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <PlayerAvatar
            src={player.photo_url}
            name={player.name}
            className="h-16 w-16 rounded-2xl bg-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xl font-semibold leading-tight truncate">{player.name}</p>
            <p className="text-xs text-white/60">
              {player.team_name ?? "—"} · {player.position ?? "—"} · {s?.season ?? "2025-26"}
            </p>
          </div>
        </div>
      </div>

      {hasContent && (
        <div className="rounded-3xl bg-gradient-to-br from-[#1520A6]/70 via-[#1b2a7a] to-[#0f152d] p-5 md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">AI Insight</p>
          {bullets.length > 0 && (
            <ul className="mt-4 space-y-2">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-white/90">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          {fullText && (
            <>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-4 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition touch-manipulation min-h-[44px] min-w-[44px]"
              >
                <span>{expanded ? "Hide details" : "View full analysis"}</span>
                <svg className={`w-4 h-4 transition ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 leading-relaxed">{fullText}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60 mb-3">Key stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {attackingStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl p-4 ${stat.highlight ? "bg-[#1520A6]/25 border border-[#1520A6]/40" : "bg-white/5"}`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">{stat.label}</p>
              <p className="mt-2 text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSearchAgain}
          className="min-h-[44px] px-5 rounded-2xl bg-white/10 text-white font-medium text-sm touch-manipulation hover:bg-white/15"
        >
          Search again
        </button>
        {onCompareWithAnother && (
          <button
            type="button"
            onClick={onCompareWithAnother}
            className="min-h-[44px] px-5 rounded-2xl bg-[#1520A6] text-white font-semibold text-sm touch-manipulation hover:bg-[#1520A6]/90"
          >
            Compare with another player
          </button>
        )}
      </div>
    </div>
  );
}
