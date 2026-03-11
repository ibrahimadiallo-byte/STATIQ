const keyStats = [
  { label: "Goals", value: "18", delta: "+3", highlight: true },
  { label: "Assists", value: "11", delta: "+2" },
  { label: "Minutes", value: "2,310", delta: "90%" },
  { label: "Rating", value: "7.9", delta: "+0.4", highlight: true },
];

const advancedStats = [
  { label: "xG", value: "15.4", sub: "0.62 / 90" },
  { label: "xA", value: "7.2", sub: "0.29 / 90" },
  { label: "Prog Passes", value: "4.8", sub: "+12% YoY" },
  { label: "Shots / 90", value: "3.7", sub: "+0.4 / 90" },
];

type ProfilePageProps = {
  playerName?: string;
};

export function ProfilePage({ playerName = "Kylian Mbappe" }: ProfilePageProps) {
  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10" />
          <div>
            <p className="text-lg font-semibold">{playerName}</p>
            <p className="text-xs text-white/60">
              Real Madrid · FW · France
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {keyStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl p-4 ${
                stat.highlight
                  ? "bg-[#1520A6]/25 border border-[#1520A6]/40"
                  : "bg-white/5"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                {stat.label}
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-lg font-semibold">{stat.value}</p>
                <span className="text-xs text-emerald-300">{stat.delta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
          Advanced metrics
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {advancedStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/5 p-3"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                {stat.label}
              </p>
              <p className="text-base font-semibold">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#1520A6]/70 via-[#1b2a7a] to-[#0f152d] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
          Insight report
        </p>
        <p className="mt-3 text-sm text-white/80">
          Mbappe is in elite form with strong shot volume and improved
          creativity. His xG trend suggests consistency, and his chance
          creation has ticked up compared to last season.
        </p>
      </div>
    </section>
  );
}
