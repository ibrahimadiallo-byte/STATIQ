import { useEffect, useState } from "react";
import { getPlayerProfile, type ProfileResponse, type PlayerStat, type ExternalStat, type DigitalImpact } from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

function DigitalImpactSection({ digitalImpact }: { digitalImpact: DigitalImpact }) {
  const hasData =
    digitalImpact &&
    ((digitalImpact.engagementSpikes?.length ?? 0) > 0 ||
      (digitalImpact.regionalDemographics?.length ?? 0) > 0 ||
      digitalImpact.hypeScore != null);

  if (!hasData) {
    return (
      <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 md:p-6 shadow-lg border border-white/5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
          Digital Impact
        </p>
        <p className="mt-2 text-sm text-white/50">
          Nielsen Fan Insights (engagement spikes & regional fan demographics) not yet available for this player.
        </p>
      </div>
    );
  }

  const spikes = digitalImpact!.engagementSpikes ?? [];
  const regions = digitalImpact!.regionalDemographics ?? [];
  const hype = digitalImpact!.hypeScore;

  return (
    <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 md:p-6 shadow-lg border border-white/5">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
        Digital Impact
      </p>
      <p className="mt-1 text-xs text-white/50">
        Social engagement & regional fan demographics (Nielsen Fan Insights) — hype ahead of the World Cup.
      </p>

      {hype != null && (
        <div className="mt-4 rounded-2xl bg-[#1520A6]/20 border border-[#1520A6]/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Hype score</p>
          <p className="mt-1 text-2xl font-bold text-white">{hype}</p>
          <p className="mt-0.5 text-xs text-white/60">Relative buzz vs. peers</p>
        </div>
      )}

      {spikes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Engagement spikes</p>
          <ul className="mt-2 space-y-2">
            {spikes.slice(0, 5).map((s, i) => (
              <li key={i} className="rounded-xl bg-white/5 p-3 text-sm text-white/80">
                {typeof s === "object" && s !== null ? (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {Object.entries(s as Record<string, unknown>)
                      .filter(([, v]) => v != null && v !== "")
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-white/50 capitalize">{String(k).replace(/_/g, " ")}</dt>
                          <dd>{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  String(s)
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {regions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Regional fan demographics</p>
          <ul className="mt-2 space-y-2">
            {regions.slice(0, 5).map((r, i) => (
              <li key={i} className="rounded-xl bg-white/5 p-3 text-sm text-white/80">
                {typeof r === "object" && r !== null ? (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {Object.entries(r as Record<string, unknown>)
                      .filter(([, v]) => v != null && v !== "")
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-white/50 capitalize">{String(k).replace(/_/g, " ")}</dt>
                          <dd>{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  String(r)
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type ProfilePageProps = {
  playerId: string | null;
};

export function ProfilePage({ playerId }: ProfilePageProps) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const { player, stats, externalStats, insight, digitalImpact } = data;
  const s: PlayerStat | undefined = stats?.[0];

  const keyStats = [
    { label: "Goals", value: String(s?.goals ?? 0) },
    { label: "Assists", value: String(s?.assists ?? 0) },
    { label: "Minutes", value: s?.minutes_played != null ? s.minutes_played.toLocaleString() : "—" },
    { label: "xG", value: s?.xg != null ? String(Number(s.xg)) : "—", highlight: true },
    { label: "xA", value: s?.xa != null ? String(Number(s.xa)) : "—", highlight: true },
  ];

  return (
    <section className="pb-6">
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
              {player.team_name ?? "—"} · {player.position ?? "—"}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {keyStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl p-4 ${
                stat.highlight
                  ? "bg-[#1520A6]/25 border border-[#1520A6]/40"
                  : "bg-white/5"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                {stat.label}
              </p>
              <p className="mt-2 text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 md:p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
          Season
        </p>
        <p className="mt-2 text-white/80">{s?.season ?? "—"}</p>
      </div>

      {externalStats && externalStats.length > 0 && (
        <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 md:p-6 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            Other sources
          </p>
          <p className="mt-1 text-xs text-white/50">
            Aggregated from multiple data sources (PRD).
          </p>
          <ul className="mt-4 space-y-3">
            {externalStats.map((es: ExternalStat, i: number) => (
              <li
                key={es.id ?? `${es.source}-${es.season ?? i}`}
                className="rounded-2xl bg-white/5 p-4 border border-white/10"
              >
                <p className="text-sm font-medium text-white/90">
                  {es.source}
                  {es.season ? ` · ${es.season}` : ""}
                </p>
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
        </div>
      )}

      <DigitalImpactSection digitalImpact={digitalImpact ?? null} />

      <InsightReportSection insight={insight} />
    </section>
  );
}

function InsightReportSection({ insight }: { insight: { summary_text: string; bullets?: string[]; full_text?: string } | null }) {
  const [expanded, setExpanded] = useState(false);

  // Parse the insight data
  let bullets: string[] = [];
  let fullText = '';

  if (insight?.summary_text) {
    try {
      const parsed = JSON.parse(insight.summary_text);
      bullets = parsed.bullets || [];
      fullText = parsed.full_text || '';
    } catch {
      // Legacy format - just show the text
      fullText = insight.summary_text;
    }
  }

  // Use provided bullets/full_text if available (new format)
  if (insight?.bullets?.length) bullets = insight.bullets;
  if (insight?.full_text) fullText = insight.full_text;

  const hasContent = bullets.length > 0 || fullText;

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
          {/* Bullet Points - Key Takeaways */}
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

          {/* Expand Button */}
          {fullText && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-5 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition"
            >
              <span>{expanded ? 'Hide details' : 'View full analysis'}</span>
              <svg
                className={`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* Full Text - Expandable */}
          {expanded && fullText && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60 leading-relaxed">{fullText}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
