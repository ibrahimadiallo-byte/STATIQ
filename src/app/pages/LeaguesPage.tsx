const leagues = [
  { name: "Premier League", status: "Live standings" },
  { name: "La Liga", status: "Live standings" },
  { name: "Bundesliga", status: "Live standings" },
  { name: "Serie A", status: "Live standings" },
];

export function LeaguesPage() {
  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Leagues
        </p>
        <h2 className="mt-2 text-xl font-semibold">Standings & Leaders</h2>
        <p className="mt-2 text-sm text-white/70">
          Track the top leagues in real time.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {leagues.map((league) => (
          <div
            key={league.name}
            className="rounded-2xl bg-[#0f152d] p-4 shadow-lg"
          >
            <p className="text-sm font-semibold">{league.name}</p>
            <p className="mt-2 text-xs text-white/60">{league.status}</p>
            <p className="mt-2 text-xs text-[#1520A6]">Realtime data</p>
          </div>
        ))}
      </div>
    </section>
  );
}
