import { useEffect, useState } from "react";
import { User, Users2, Trophy, TrendingUp, BarChart3, Globe } from "lucide-react";

type WorldCupInfo = {
  name: string;
  startDate: string;
  hosts: string[];
  totalTeams: number;
  countdown: { days: number; hours: number; minutes: number };
};

type HomePageProps = { onGetStarted?: () => void };

export function HomePage({ onGetStarted }: HomePageProps) {
  const [wcInfo, setWcInfo] = useState<WorldCupInfo | null>(null);

  useEffect(() => {
    fetch("/api/world-cup/info")
      .then((r) => r.json())
      .then(setWcInfo)
      .catch(() => {});
  }, []);

  const countdown = wcInfo?.countdown;

  const features = [
    {
      icon: User,
      title: "Player Profiles",
      description: "AI-generated insights that explain what the numbers actually mean",
    },
    {
      icon: Users2,
      title: "Head-to-Head Comparison",
      description: "Compare any two players side by side — who's ahead, and why",
    },
    {
      icon: Trophy,
      title: "13,000+ Players",
      description: "Coverage across top leagues worldwide, constantly updated",
    },
    {
      icon: TrendingUp,
      title: "Performance Trends",
      description: "Track form over time with visual charts and smart summaries",
    },
    {
      icon: BarChart3,
      title: "All Key Stats",
      description: "One screen — all the metrics that matter, no hunting around",
    },
    {
      icon: Globe,
      title: "Global Leagues",
      description: "Premier League, La Liga, Serie A, Bundesliga, and more",
    },
  ];

  return (
    <section className="pb-8">
      {/* Hero — two columns: left copy (STATIQ, subheading, bullet, CTA) + right visual */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1520A6] via-[#1b2a7a] to-[#0f152d] p-6 md:p-8 shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            {/* Left: product name, subheading, single bullet, CTA */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                STATIQ
              </h1>
              <p className="mt-1 text-sm md:text-base uppercase tracking-[0.2em] text-white/80 font-semibold">
                AI-Powered Sports Analytics
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex gap-2 items-start text-sm md:text-base text-white/95">
                  <span className="text-[#4f6bff] font-bold shrink-0 mt-0.5">•</span>
                  <span>Instant results — search any player, get smart insights</span>
                </li>
              </ul>
            {onGetStarted && (
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-5 min-h-[48px] px-6 rounded-2xl bg-white text-[#1520A6] font-bold text-base shadow-lg hover:bg-white/95 active:scale-[0.98] transition"
              >
                Get Started
              </button>
            )}
          </div>
          {/* Right: visual — logo + gradient (no external images) */}
          <div className="flex-shrink-0 flex items-center justify-center md:justify-end">
            <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden bg-[#0f152d]/60 border border-white/10 flex items-center justify-center">
              <img
                src="/logo.png"
                alt=""
                className="w-28 h-28 md:w-36 md:h-36 object-contain opacity-90"
              />
            </div>
          </div>
        </div>
      </div>

      {/* World Cup countdown — compact */}
      {wcInfo && countdown && countdown.days > 0 && (
        <div className="mt-4 rounded-2xl bg-[#111730] px-4 py-3 flex items-center justify-between gap-4 border border-white/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">
              {wcInfo.name}
            </p>
            <p className="text-sm font-semibold text-white">{wcInfo.hosts.join(" · ")}</p>
          </div>
          <div className="flex gap-2">
            {[
              { v: countdown.days, l: "Days" },
              { v: countdown.hours, l: "Hrs" },
              { v: countdown.minutes, l: "Min" },
            ].map(({ v, l }) => (
              <div
                key={l}
                className="bg-[#1520A6]/40 rounded-xl px-3 py-2 text-center min-w-[3rem]"
              >
                <p className="text-xl font-black tabular-nums leading-none">{v}</p>
                <p className="text-[10px] text-white/70 uppercase">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature grid — 2x3 */}
      <div className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl bg-[#111730] p-5 border border-white/10 shadow-lg"
            >
              <div className="h-10 w-10 rounded-xl bg-[#1520A6] flex items-center justify-center text-white mb-3">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm text-white/70 leading-snug">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm font-semibold text-white/80">
          FIFA World Cup 2026 · Football / Soccer
        </p>
      </div>
    </section>
  );
}
