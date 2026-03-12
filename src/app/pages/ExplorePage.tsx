export function ExplorePage() {
  return (
    <section className="pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-[#1b2a7a] via-[#1520A6] to-[#4f6bff] p-5 md:p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <span className="text-xs font-semibold">PL</span>
          </div>
          <span className="uppercase tracking-[0.25em] text-[11px]">
            Premier League
          </span>
        </div>
        <div className="mt-6">
          <p className="text-3xl font-semibold italic tracking-wide leading-none">
            MATCH
          </p>
          <p className="text-4xl font-black italic tracking-wide leading-none">
            DAY
          </p>
          <p className="text-4xl font-black italic tracking-wide text-white/70 leading-none">
            LIVE
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/70">
            Catch the thrill - live on STATIQ app
          </p>
        </div>
        <div className="mt-6 rounded-2xl bg-white/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20" />
              <div>
                        <p className="text-sm font-semibold uppercase tracking-wide">
                          Kylian Mbappe
                        </p>
                        <p className="text-xs text-white/60">Real Madrid</p>
              </div>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/70">
              vs
            </span>
            <div className="flex items-center gap-3 text-right">
              <div>
                        <p className="text-sm font-semibold uppercase tracking-wide">
                          Erling Haaland
                        </p>
                        <p className="text-xs text-white/60">Man City</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/70">
            <span>Key matchup · Data: Live feed</span>
            <span>Updated just now</span>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Today’s Matches</p>
          <button className="text-xs uppercase tracking-[0.2em] text-white/50">
            View all
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {[
            {
              home: "Arsenal",
              away: "Chelsea",
              time: "8:00 PM",
              status: "Live",
              score: "1 - 1",
            },
            {
              home: "Real Madrid",
              away: "Sevilla",
              time: "3:00 PM",
              status: "Upcoming",
              score: "—",
            },
            {
              home: "Bayern",
              away: "Dortmund",
              time: "1:30 PM",
              status: "Upcoming",
              score: "—",
            },
          ].map((match) => (
            <div
              key={`${match.home}-${match.away}`}
              className="rounded-2xl bg-[#111730] px-4 py-4 md:px-5 md:py-5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-1 rounded-full bg-[#1520A6]" />
                    <p className="text-sm font-semibold uppercase tracking-wide">
                      {match.home}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-1 rounded-full bg-white/60" />
                    <p className="text-sm font-semibold uppercase tracking-wide">
                      {match.away}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm font-semibold">
                  <p className="text-lg">{match.score}</p>
                  <p className="text-xs text-white/60">{match.time}</p>
                  <p
                    className={`text-xs uppercase tracking-[0.2em] ${
                      match.status === "Live"
                        ? "text-emerald-300"
                        : "text-white/60"
                    }`}
                  >
                    {match.status}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>Poss 58%</span>
                <span>xG 1.2</span>
                <span className="text-[#1520A6]">Realtime</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Top Players</p>
          <button className="text-xs uppercase tracking-[0.2em] text-white/50">
            Rankings
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Mbappe", stat: "xG", value: "0.62/90" },
            { name: "Bellingham", stat: "Chances", value: "3.1/90" },
            { name: "Saka", stat: "Assists", value: "11" },
            { name: "Rice", stat: "Recoveries", value: "8.4" },
          ].map((player) => (
            <div
              key={player.name}
              className="rounded-2xl bg-[#0f152d] p-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10" />
                <div>
                  <p className="text-sm font-semibold">{player.name}</p>
                  <p className="text-xs text-white/60">{player.stat}</p>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <span className="text-white/60">Metric</span>
                <span className="text-white font-semibold">{player.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Trending Stats</p>
          <button className="text-xs uppercase tracking-[0.2em] text-white/50">
            View
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Top xG", value: "18.4", note: "+12%" },
            { label: "Chances", value: "3.8/90", note: "+8%" },
            { label: "Pressures", value: "21/90", note: "+6%" },
            { label: "Pass %", value: "91%", note: "+2%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-[#111730] p-4 shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                {stat.label}
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-xs text-emerald-300">{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Latest News</p>
          <button className="text-xs uppercase tracking-[0.2em] text-white/50">
            Updates
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {[
            {
              title: "Title race tightens after derby draw",
              time: "2m ago",
            },
            {
              title: "UCL spots: key fixtures this weekend",
              time: "18m ago",
            },
            {
              title: "Injury update: midfield star returns",
              time: "45m ago",
            },
          ].map((news) => (
            <div
              key={news.title}
              className="rounded-2xl bg-[#0f152d] px-4 py-4 shadow-lg"
            >
              <p className="text-sm font-semibold">{news.title}</p>
              <p className="mt-2 text-xs text-white/60">
                {news.time} · Data: Live feed
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
