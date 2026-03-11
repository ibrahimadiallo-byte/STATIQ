const comparisonStats = [
  { label: "Goals", left: "18", right: "14", lead: "left" },
  { label: "Assists", left: "11", right: "9", lead: "left" },
  { label: "xG", left: "15.4", right: "12.1", lead: "left" },
  { label: "xA", left: "7.2", right: "6.0", lead: "left" },
];

export function ComparePage() {
  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10" />
            <div>
              <p className="text-sm font-semibold">Kylian Mbappe</p>
              <p className="text-xs text-white/60">Real Madrid</p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            vs
          </span>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10" />
            <div>
              <p className="text-sm font-semibold">Erling Haaland</p>
              <p className="text-xs text-white/60">Man City</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-[#0f152d] p-5 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
          Head-to-head
        </p>
        <div className="mt-4 space-y-3">
          {comparisonStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm"
            >
              <span
                className={`w-12 text-left font-semibold ${
                  stat.lead === "left" ? "text-emerald-300" : "text-white"
                }`}
              >
                {stat.left}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                {stat.label}
              </span>
              <span
                className={`w-12 text-right font-semibold ${
                  stat.lead === "right" ? "text-emerald-300" : "text-white"
                }`}
              >
                {stat.right}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-[#111730] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
          Insight
        </p>
        <p className="mt-3 text-sm text-white/80">
          Mbappe leads on chance creation and overall volume, while Haaland
          remains the more clinical finisher inside the box.
        </p>
      </div>
    </section>
  );
}
