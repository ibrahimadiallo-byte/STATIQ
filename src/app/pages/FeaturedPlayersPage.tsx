import { useEffect, useState } from "react";
import { searchPlayers, getPlayerProfile, type ProfileResponse } from "@/app/lib/api";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

type FeaturedPlayer = { name: string; team: string; flag: string };

// Only players that typically have profile + photo + stats in the DB (avoid Watch tab errors)
const FEATURED: FeaturedPlayer[] = [
  { name: "Lionel Messi", team: "Inter Miami", flag: "🇦🇷" },
  { name: "Cristiano Ronaldo", team: "Al-Nassr", flag: "🇵🇹" },
  { name: "Mohamed Salah", team: "Liverpool", flag: "🇪🇬" },
  { name: "Bukayo Saka", team: "Arsenal", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Phil Foden", team: "Manchester City", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Jude Bellingham", team: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
];

type CardState =
  | { status: "loading" }
  | { status: "loaded"; profile: ProfileResponse }
  | { status: "error"; playerId?: string };

type FeaturedPlayersPageProps = {
  onSelectPlayer?: (playerId: string) => void;
};

export function FeaturedPlayersPage({ onSelectPlayer }: FeaturedPlayersPageProps) {
  const [cards, setCards] = useState<Record<string, CardState>>(() =>
    Object.fromEntries(FEATURED.map((p) => [p.name, { status: "loading" as const }]))
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next: Record<string, CardState> = {};
      for (const item of FEATURED) {
        if (cancelled) return;
        try {
          const { candidates } = await searchPlayers(item.name);
          const first = candidates?.[0];
          if (!first) {
            next[item.name] = { status: "error" };
            continue;
          }
          if (cancelled) return;
          try {
            const profile = await getPlayerProfile(first.id);
            if (cancelled) return;
            next[item.name] = { status: "loaded", profile };
          } catch {
            next[item.name] = { status: "error", playerId: first.id };
          }
        } catch {
          next[item.name] = { status: "error" };
        }
      }
      if (!cancelled) setCards((prev) => ({ ...prev, ...next }));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadedWithStatsAndPicture = FEATURED.filter((item) => {
    const state = cards[item.name];
    if (state?.status !== "loaded") return false;
    const { player, stats } = state.profile;
    const hasPicture =
      player.photo_url != null && String(player.photo_url).trim() !== "";
    const s = stats?.[0];
    const hasStat =
      s &&
      (s.goals != null ||
        s.assists != null ||
        s.minutes_played != null ||
        s.xg != null ||
        s.xa != null);
    return !!hasPicture && !!hasStat;
  });

  const anyStillLoading = FEATURED.some((item) => cards[item.name]?.status === "loading");

  return (
    <section className="pb-6">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
        Players to watch
      </p>
      <p className="mt-1 text-base text-white/90">
        Key stats for each player. View full profile to compare or see AI insight.
      </p>
      {anyStillLoading && loadedWithStatsAndPicture.length === 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-[#111730] border border-white/10 p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-white/10 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loadedWithStatsAndPicture.map((item) => {
          const state = cards[item.name];
          if (state?.status !== "loaded") return null;
          return (
            <div
              key={item.name}
              className="rounded-2xl bg-[#111730] border border-white/10 p-4 shadow-lg"
            >
              <>
                <button
                  type="button"
                  onClick={() => onSelectPlayer?.(state.profile.player.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <PlayerAvatar
                      src={state.profile.player.photo_url}
                      name={state.profile.player.name}
                      className="h-14 w-14 rounded-xl bg-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {state.profile.player.name}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {state.profile.player.team_name ?? item.team}
                      </p>
                    </div>
                    <span className="text-white/40 text-xs shrink-0">View →</span>
                  </div>
                </button>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCell label="G" value={state.profile.stats?.[0]?.goals} />
                  <StatCell label="A" value={state.profile.stats?.[0]?.assists} />
                  <StatCell
                    label="xG"
                    value={
                      state.profile.stats?.[0]?.xg != null
                        ? state.profile.stats[0].xg!.toFixed(2)
                        : null
                    }
                  />
                  <StatCell
                    label="xA"
                    value={
                      state.profile.stats?.[0]?.xa != null
                        ? state.profile.stats[0].xa!.toFixed(2)
                        : null
                    }
                  />
                </div>
                {state.profile.stats?.[0]?.minutes_played != null && (
                  <p className="mt-2 text-xs text-white/50">
                    {state.profile.stats[0].minutes_played} min
                  </p>
                )}
                {onSelectPlayer && (
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(state.profile.player.id)}
                    className="mt-3 min-h-[44px] text-sm text-[#1520A6] font-medium hover:underline touch-manipulation"
                  >
                    View full profile →
                  </button>
                )}
              </>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">
        {value != null && value !== "" ? String(value) : "—"}
      </p>
    </div>
  );
}
