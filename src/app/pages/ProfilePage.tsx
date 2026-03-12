import { useEffect, useState } from "react";
import { getPlayerProfile, type ProfileResponse, type PlayerStat } from "@/app/lib/api";

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
          {error}
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { player, stats, insight } = data;
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
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover bg-white/10"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white/10" />
          )}
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

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#1520A6]/70 via-[#1b2a7a] to-[#0f152d] p-5 md:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
          Insight report
        </p>
        <p className="mt-3 text-sm text-white/80 leading-relaxed">
          {insight?.summary_text ?? "No AI insight generated yet."}
        </p>
      </div>
    </section>
  );
}
