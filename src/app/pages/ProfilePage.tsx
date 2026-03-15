import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { getPlayerProfile, type ProfileResponse, type PlayerStat, type ExternalStat } from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

type ProfilePageProps = {
  playerId: string | null;
  onBack?: () => void;
  onCompareWithAnother?: () => void;
};

export function ProfilePage({ playerId, onBack, onCompareWithAnother }: ProfilePageProps) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewMore, setShowViewMore] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPlayerProfile(playerId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  if (!playerId) {
    return (
      <section className="pb-6">
        <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg text-center text-white/70">
          Search for a player to view their profile.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="pb-6">
        <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg animate-pulse">
          <div className="h-16 w-16 rounded-2xl bg-white/10" />
          <div className="mt-4 h-4 w-32 bg-white/10 rounded" />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl p-4 bg-white/5 h-20" />
            ))}
          </div>
        </div>
        {/* Doherty: skeleton in exact shape of AI insight card */}
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#1520A6]/50 via-[#1b2a7a]/50 to-[#0f152d] p-5 md:p-6 animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-4 flex-1 max-w-[80%] bg-white/10 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-5 h-4 w-full max-w-[90%] bg-white/10 rounded" />
          <div className="mt-2 h-4 w-3/4 bg-white/10 rounded" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pb-6">
        <div className="rounded-3xl bg-[#2b1630] p-5 md:p-6 shadow-lg text-sm text-white/80">
          <p>{error}</p>
          <p className="mt-2 text-white/60 text-xs">
            Go to Search to find a player, then open their profile.
          </p>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { player, stats, externalStats, insight } = data;
  const s: PlayerStat | undefined = stats?.[0];
  const goals = s?.goals ?? 0;
  const minutes = s?.minutes_played ?? 0;
  const minsPerGoal = goals > 0 && minutes > 0 ? Math.round(minutes / goals) : null;

  // Miller's Law: max 3 categories, max 7 stats. Attacking, Efficiency, Involvement.
  const attackingStats = [
    { label: "Goals", value: String(goals) },
    { label: "Assists", value: String(s?.assists ?? 0) },
    { label: "Expected Goals (xG)", value: s?.xg != null ? String(Number(s.xg)) : "—", highlight: true },
    { label: "Expected Assists (xA)", value: s?.xa != null ? String(Number(s.xa)) : "—", highlight: true },
  ];
  const efficiencyStats = minsPerGoal != null ? [{ label: "Minutes per goal", value: String(minsPerGoal) }] : [];
  const involvementStats = [{ label: "Minutes", value: minutes > 0 ? minutes.toLocaleString() : "—" }];
  const hasMore = externalStats && externalStats.length > 0;

  return (
    <section className="pb-6">
      {onBack && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] flex items-center gap-2 text-sm text-white/80 hover:text-white touch-manipulation"
          >
            <span aria-hidden>←</span> Back to players to watch
          </button>
        </div>
      )}
      {/* Header: name, team, position, season — Jakob's Law */}
      <div className="rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <PlayerAvatar
            src={player.photo_url}
            name={player.name}
            className="h-16 w-16 rounded-2xl bg-white/10"
          />
          <div>
            <p className="text-xl font-semibold leading-tight">{player.name}</p>
            <p className="text-xs text-white/60">
              {player.team_name ?? "—"} · {player.position ?? "—"} · {s?.season ?? "2025-26"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Insight most prominent — Elena */}
      <InsightReportSection insight={insight} playerId={playerId} onCompareWithAnother={onCompareWithAnother} />

      {/* Stats: 3 groups — Miller's Law, max 7 */}
      <div className="mt-6 rounded-3xl bg-[#111730] p-5 md:p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60 mb-3">Attacking</p>
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
        {efficiencyStats.length > 0 && (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60 mt-4 mb-3">Efficiency</p>
            <div className="grid grid-cols-2 gap-3">
              {efficiencyStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl p-4 bg-white/5">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60 mt-4 mb-3">Involvement</p>
        <div className="grid grid-cols-2 gap-3">
          {involvementStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl p-4 bg-white/5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">{stat.label}</p>
              <p className="mt-2 text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowViewMore(!showViewMore)}
              className="min-h-[44px] min-w-[44px] text-sm text-white/60 hover:text-white/80 touch-manipulation"
            >
              {showViewMore ? "View less" : "View more"}
            </button>
            {showViewMore && (
              <ul className="mt-3 space-y-3">
                {externalStats!.map((es: ExternalStat, i: number) => (
                  <li key={es.id ?? `${es.source}-${es.season ?? i}`} className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <p className="text-sm font-medium text-white/90">{es.source}{es.season ? ` · ${es.season}` : ""}</p>
                    {es.payload && typeof es.payload === "object" && (
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-white/70">
                        {Object.entries(es.payload)
                          .filter(([, v]) => v != null && v !== "")
                          .slice(0, 8)
                          .map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <dt className="text-white/50">{k.replace(/_/g, " ")}</dt>
                              <dd>{String(v)}</dd>
                            </div>
                          ))}
                      </dl>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function InsightReportSection({
  insight,
  playerId,
  onCompareWithAnother,
}: {
  insight: { summary_text: string; bullets?: string[]; full_text?: string } | null;
  playerId: string | null;
  onCompareWithAnother?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  // Parse the insight data — never show raw JSON or code blocks
  let bullets: string[] = [];
  let fullText = "";

  if (insight?.summary_text) {
    const raw = insight.summary_text.trim();
    let parsed: { bullets?: string[]; full_text?: string; analysis?: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonBlock = raw.match(/\{[\s\S]*\}/);
      if (jsonBlock) {
        try {
          parsed = JSON.parse(jsonBlock[0]);
        } catch {
          parsed = null;
        }
      }
    }
    if (parsed) {
      bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
      fullText = (parsed.full_text || parsed.analysis || "").trim();
    } else {
      fullText = raw.replace(/```[\s\S]*?```/g, "").trim();
      if (fullText.startsWith("{")) fullText = "";
    }
  }
  if (insight?.bullets?.length) bullets = insight.bullets;
  if (insight?.full_text) fullText = insight.full_text;

  const hasContent = bullets.length > 0 || fullText;

  const handleFeedback = (value: "up" | "down") => {
    if (feedback) return;
    setFeedback(value);
    fetch("/api/insight-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, helpful: value === "up" }),
    }).catch(() => {});
  };

  return (
    <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#1520A6]/70 via-[#1b2a7a] to-[#0f152d] p-5 md:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
          AI Insight Report
        </p>
        <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/50">
          Powered by AI
        </span>
      </div>

      {!hasContent ? (
        <p className="mt-3 text-sm text-white/50">No AI insight generated yet.</p>
      ) : (
        <>
          {bullets.length > 0 && (
            <ul className="mt-5 space-y-3">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-lg shadow-emerald-400/30" />
                  <span className="text-base font-medium text-white">{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {fullText && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-5 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition touch-manipulation min-h-[44px] min-w-[44px]"
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

          {/* Thumbs up / down — HEART Happiness */}
          {hasContent && (
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-4">
              <span className="text-xs text-white/50">Was this helpful?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedback("up")}
                  disabled={!!feedback}
                  className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition touch-manipulation ${
                    feedback === "up" ? "bg-emerald-500/30 text-emerald-400" : "bg-white/10 text-white/60 active:bg-white/20"
                  }`}
                  aria-label="Helpful"
                >
                  <ThumbsUp className="w-5 h-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback("down")}
                  disabled={!!feedback}
                  className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition touch-manipulation ${
                    feedback === "down" ? "bg-red-500/30 text-red-400" : "bg-white/10 text-white/60 active:bg-white/20"
                  }`}
                  aria-label="Not helpful"
                >
                  <ThumbsDown className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Compare CTA — HEART Engagement */}
      {onCompareWithAnother && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCompareWithAnother}
            className="w-full min-h-[44px] rounded-2xl bg-[#1520A6] text-white font-semibold text-sm py-3 px-4 touch-manipulation active:bg-[#1520A6]/80"
          >
            Compare with another player
          </button>
        </div>
      )}
    </div>
  );
}
