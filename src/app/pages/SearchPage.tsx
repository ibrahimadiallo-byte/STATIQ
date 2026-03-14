import { useEffect, useState, useCallback, useRef } from "react";
import { searchPlayers, type SearchResponse, type Player } from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

type SearchPageProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectPlayer: (playerId: string) => void;
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
  onSelectPlayer,
}: SearchPageProps) {
  const [results, setResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 280);

  const runSearch = useCallback(async (signal: AbortSignal) => {
    if (!debouncedQuery) {
      setResults([]);
      setErrorMessage(null);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data: SearchResponse = await searchPlayers(debouncedQuery, { signal });
      if (!signal.aborted) setResults(data.candidates ?? []);
    } catch (err) {
      if (!signal.aborted) {
        const msg =
          err instanceof Error ? err.message : String(err) || "Something went wrong. Please try again.";
        setErrorMessage(msg);
        setResults([]);
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
    onSelectPlayer(player.id);
    onQueryChange("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <section className="pb-6">
      <div className="rounded-2xl bg-[#111730] p-4 md:p-5 shadow-lg">
        <label className="text-xs uppercase tracking-[0.25em] text-white/60">
          Search players
        </label>
        <div className="mt-3 relative" ref={dropdownRef}>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1520A6]" />
            <input
              ref={inputRef}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              placeholder="Type to search (e.g. ma, Bellingham, Mbappe)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
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
                    <>No players found for &quot;{displayQuery}&quot;. Try a full surname or another spelling.</>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
            <>No players found for &quot;{displayQuery}&quot;. Try a full surname or another spelling.</>
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
    </section>
  );
}
