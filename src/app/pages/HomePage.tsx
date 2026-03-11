export function HomePage() {
  return (
    <section className="pb-6">
      <div className="rounded-3xl bg-[#111730] p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Welcome back
        </p>
        <h2 className="mt-2 text-xl font-semibold">Your Home Feed</h2>
        <p className="mt-2 text-sm text-white/70">
          Personalized updates, saved players, and match alerts.
        </p>
      </div>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#1520A6] via-[#1b2a7a] to-[#0f152d] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">
          Match alert · Live
        </p>
        <p className="mt-3 text-lg font-semibold">Arsenal vs Chelsea</p>
        <p className="text-sm text-white/70">Score: 1 - 1 · 68’</p>
        <p className="mt-2 text-xs text-white/60">Data: Live feed</p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Saved Players</p>
          <button className="text-xs uppercase tracking-[0.2em] text-white/50">
            Manage
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["Mbappe", "Bellingham", "Saka", "Rice"].map((player) => (
            <div
              key={player}
              className="rounded-2xl bg-[#0f152d] p-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10" />
                <div>
                  <p className="text-sm font-semibold">{player}</p>
                  <p className="text-xs text-white/60">Live rating</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/60">Data: Live feed</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Alerts</p>
          <button className="text-xs uppercase tracking-[0.2em] text-white/50">
            Settings
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {[
            "Goal scored by your tracked player",
            "Team lineup released",
            "Match kickoff in 30 minutes",
          ].map((alert) => (
            <div
              key={alert}
              className="rounded-2xl bg-[#111730] px-4 py-4 shadow-lg"
            >
              <p className="text-sm font-semibold">{alert}</p>
              <p className="mt-2 text-xs text-white/60">Realtime alert</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
