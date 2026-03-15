import { useEffect, useState, useCallback } from "react";
import {
  getCompare,
  getPlayerProfile,
  searchPlayers,
  type CompareResponse,
  type Player,
  type SearchResponse,
} from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

type ComparePageProps = {
  preselectedPlayerId?: string | null;
};

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function ComparePage({ preselectedPlayerId }: ComparePageProps) {
  const [player1Id, setPlayer1Id] = useState<string | null>(preselectedPlayerId ?? null);
  const [player2Id, setPlayer2Id] = useState<string | null>(null);
  const [player1Query, setPlayer1Query] = useState("");
  const [player2Query, setPlayer2Query] = useState("");
  const [search1Results, setSearch1Results] = useState<Player[]>([]);
  const [search2Results, setSearch2Results] = useState<Player[]>([]);
  const [search1Open, setSearch1Open] = useState(false);
  const [search2Open, setSearch2Open] = useState(false);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [player1Info, setPlayer1Info] = useState<Player | null>(null);
  const [player2Info, setPlayer2Info] = useState<Player | null>(null);

  const dq1 = useDebounce(player1Query.trim(), 400);
  const dq2 = useDebounce(player2Query.trim(), 400);

  useEffect(() => {
    setPlayer1Id((prev) => preselectedPlayerId ?? prev);
  }, [preselectedPlayerId]);

  const runSearch = useCallback(
    async (q: string, setResults: (p: Player[]) => void) => {
      if (!q) {
        setResults([]);
        return;
      }
      try {
        const data: SearchResponse = await searchPlayers(q);
        setResults(data.candidates ?? []);
      } catch {
        setResults([]);
      }
    },
    []
  );

  useEffect(() => {
    runSearch(dq1, setSearch1Results);
  }, [dq1, runSearch]);
  useEffect(() => {
    runSearch(dq2, setSearch2Results);
  }, [dq2, runSearch]);

  useEffect(() => {
    if (!player1Id) {
      setPlayer1Info(null);
      return;
    }
    let cancelled = false;
    getPlayerProfile(player1Id)
      .then((res) => {
        if (!cancelled) setPlayer1Info(res.player);
      })
      .catch(() => {
        if (!cancelled) setPlayer1Info(null);
      });
    return () => {
      cancelled = true;
    };
  }, [player1Id]);

  useEffect(() => {
    if (!player2Id) {
      setPlayer2Info(null);
      return;
    }
    let cancelled = false;
    getPlayerProfile(player2Id)
      .then((res) => {
        if (!cancelled) setPlayer2Info(res.player);
      })
      .catch(() => {
        if (!cancelled) setPlayer2Info(null);
      });
    return () => {
      cancelled = true;
    };
  }, [player2Id]);

  useEffect(() => {
    if (!player1Id || !player2Id || player1Id === player2Id) {
      setCompareData(null);
      setCompareError(null);
      return;
    }
    let cancelled = false;
    setCompareLoading(true);
    setCompareError(null);
    getCompare(player1Id, player2Id)
      .then((res) => {
        if (!cancelled) setCompareData(res);
      })
      .catch((err) => {
        if (!cancelled)
          setCompareError(err instanceof Error ? err.message : "Comparison failed");
      })
      .finally(() => {
        if (!cancelled) setCompareLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [player1Id, player2Id]);


  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60 mb-4">
          Player 1
        </p>
        {player1Id && (compareData?.player1 ?? player1Info) ? (
          <div className="flex items-center gap-3">
            <PlayerAvatar
              src={(compareData?.player1 ?? player1Info)?.photo_url}
              name={(compareData?.player1 ?? player1Info)?.name}
              className="h-12 w-12 rounded-2xl bg-white/10"
            />
            <div>
              <p className="text-sm font-semibold">{(compareData?.player1 ?? player1Info)!.name}</p>
              <p className="text-xs text-white/60">{(compareData?.player1 ?? player1Info)!.team_name ?? "—"}</p>
            </div>
            <button
              type="button"
              className="text-xs text-white/50 hover:text-white/80"
              onClick={() => setPlayer1Id(null)}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none"
              placeholder="Search to select player 1"
              value={player1Query}
              onChange={(e) => {
                setPlayer1Query(e.target.value);
                setSearch1Open(true);
              }}
              onFocus={() => setSearch1Open(true)}
            />
            {search1Open && (search1Results.length > 0 || dq1) && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-[#0f152d] shadow-lg z-10 overflow-hidden">
                {search1Results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                    onClick={() => {
                      setPlayer1Id(p.id);
                      setPlayer1Query("");
                      setSearch1Open(false);
                    }}
                  >
                    <PlayerAvatar
                      src={p.photo_url}
                      name={p.name}
                      className="h-8 w-8 rounded-lg bg-white/10"
                    />
                    <span>{p.name}</span>
                    <span className="text-white/50 text-xs">{p.team_name ?? ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60 mb-4">
          Player 2
        </p>
        {player2Id && (compareData?.player2 ?? player2Info) ? (
          <div className="flex items-center gap-3">
            <PlayerAvatar
              src={(compareData?.player2 ?? player2Info)?.photo_url}
              name={(compareData?.player2 ?? player2Info)?.name}
              className="h-12 w-12 rounded-2xl bg-white/10"
            />
            <div>
              <p className="text-sm font-semibold">{(compareData?.player2 ?? player2Info)!.name}</p>
              <p className="text-xs text-white/60">{(compareData?.player2 ?? player2Info)!.team_name ?? "—"}</p>
            </div>
            <button
              type="button"
              className="text-xs text-white/50 hover:text-white/80"
              onClick={() => setPlayer2Id(null)}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none"
              placeholder="Search to select player 2"
              value={player2Query}
              onChange={(e) => {
                setPlayer2Query(e.target.value);
                setSearch2Open(true);
              }}
              onFocus={() => setSearch2Open(true)}
            />
            {search2Open && (search2Results.length > 0 || dq2) && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-[#0f152d] shadow-lg z-10 overflow-hidden">
                {search2Results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                    onClick={() => {
                      setPlayer2Id(p.id);
                      setPlayer2Query("");
                      setSearch2Open(false);
                    }}
                  >
                    <PlayerAvatar
                      src={p.photo_url}
                      name={p.name}
                      className="h-8 w-8 rounded-lg bg-white/10"
                    />
                    <span>{p.name}</span>
                    <span className="text-white/50 text-xs">{p.team_name ?? ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {compareLoading && (
        <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 md:p-6 animate-pulse">
          <div className="h-6 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {compareError && (
        <div className="mt-6 rounded-3xl bg-[#2b1630] p-5 md:p-6 text-sm text-white/80">
          <p>{compareError}</p>
          <p className="mt-2 text-white/60 text-xs">
            Try again or pick different players.
          </p>
        </div>
      )}

      {compareData && !compareLoading && (
        <>
          <div className="mt-6 rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  src={compareData.player1.photo_url}
                  name={compareData.player1.name}
                  className="h-12 w-12 rounded-2xl bg-white/10"
                />
                <div>
                  <p className="text-sm font-semibold">{compareData.player1.name}</p>
                  <p className="text-xs text-white/60">{compareData.player1.team_name ?? "—"}</p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">vs</span>
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  src={compareData.player2.photo_url}
                  name={compareData.player2.name}
                  className="h-12 w-12 rounded-2xl bg-white/10"
                />
                <div>
                  <p className="text-sm font-semibold">{compareData.player2.name}</p>
                  <p className="text-xs text-white/60">{compareData.player2.team_name ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 md:p-6 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
              Head-to-head
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Goals", left: compareData.stats1?.[0]?.goals ?? 0, right: compareData.stats2?.[0]?.goals ?? 0 },
                { label: "Assists", left: compareData.stats1?.[0]?.assists ?? 0, right: compareData.stats2?.[0]?.assists ?? 0 },
                { label: "xG", left: Number(compareData.stats1?.[0]?.xg ?? 0), right: Number(compareData.stats2?.[0]?.xg ?? 0) },
                { label: "xA", left: Number(compareData.stats1?.[0]?.xa ?? 0), right: Number(compareData.stats2?.[0]?.xa ?? 0) },
                { label: "Minutes", left: compareData.stats1?.[0]?.minutes_played ?? 0, right: compareData.stats2?.[0]?.minutes_played ?? 0 },
              ].map(({ label, left, right }) => {
                const delta = Number((left - right).toFixed(1));
                const lead = delta > 0 ? "left" : delta < 0 ? "right" : "even";
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm"
                  >
                    <span
                      className={`w-12 text-left font-semibold ${
                        lead === "left" ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {left}
                    </span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                        {label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          lead === "left"
                            ? "text-emerald-300"
                            : lead === "right"
                            ? "text-rose-300"
                            : "text-white/50"
                        }`}
                      >
                        {lead === "even" ? "EVEN" : delta > 0 ? `+${delta}` : `${delta}`}
                      </span>
                    </div>
                    <span
                      className={`w-12 text-right font-semibold ${
                        lead === "right" ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {right}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-[#111730] p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
              AI comparison
            </p>
            {compareData.verdict && (
              <p className="mt-3 text-sm font-medium text-white">
                {compareData.verdict}
              </p>
            )}
            {compareData.sustainability && (
              <p className="mt-2 text-sm text-emerald-300/90">
                {compareData.sustainability}
              </p>
            )}
            {(compareData.analysis || compareData.narrative) && (
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                {compareData.analysis || compareData.narrative}
              </p>
            )}
          </div>
        </>
      )}

      {!player1Id && !player2Id && (
        <p className="mt-6 text-center text-white/50 text-sm">
          Select two players above to compare.
        </p>
      )}
      {player1Id && !player2Id && (
        <p className="mt-6 text-center text-white/50 text-sm">
          Select player 2 to compare.
        </p>
      )}
      {player1Id && player2Id && player1Id === player2Id && (
        <p className="mt-6 text-center text-white/50 text-sm">
          Choose two different players.
        </p>
      )}
    </section>
  );
}
