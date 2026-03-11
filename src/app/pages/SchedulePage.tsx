const schedule = [
  { home: "Arsenal", away: "Chelsea", time: "8:00 PM", day: "Today" },
  { home: "Real Madrid", away: "Sevilla", time: "3:00 PM", day: "Today" },
  { home: "Bayern", away: "Dortmund", time: "1:30 PM", day: "Today" },
  { home: "Inter", away: "Milan", time: "2:45 PM", day: "Tomorrow" },
];

export function SchedulePage() {
  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Schedule
        </p>
        <h2 className="mt-2 text-xl font-semibold">Upcoming Fixtures</h2>
        <p className="mt-2 text-sm text-white/70">
          Real-time fixture list and kickoff times.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {schedule.map((match) => (
          <div
            key={`${match.home}-${match.away}`}
            className="rounded-2xl bg-[#0f152d] px-4 py-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide">
                  {match.home} vs {match.away}
                </p>
                <p className="text-xs text-white/60">{match.day}</p>
              </div>
              <p className="text-sm font-semibold">{match.time}</p>
            </div>
            <p className="mt-2 text-xs text-white/60">Data: Live feed</p>
          </div>
        ))}
      </div>
    </section>
  );
}
