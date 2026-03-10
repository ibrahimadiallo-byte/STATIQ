import { Header } from "./components/header";
import { TabNavigation } from "./components/tab-navigation";
import { BottomNavigation } from "./components/bottom-navigation";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0b0f24] text-white">
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#1520A6]/40 blur-3xl" />
          <div className="absolute top-24 -right-28 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-[#1520A6]/20 blur-3xl" />
        </div>
        <Header />
        <TabNavigation />

        <main className="relative flex-1 px-4 pb-6">
          <section className="rounded-3xl bg-gradient-to-br from-[#1b2a7a] via-[#1520A6] to-[#4f6bff] p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <span className="text-xs font-semibold">PL</span>
              </div>
              <span className="uppercase tracking-widest text-[11px]">Premier League</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-semibold italic tracking-wide">MATCH</p>
              <p className="text-4xl font-black italic tracking-wide">DAY</p>
              <p className="text-4xl font-black italic tracking-wide text-white/70">LIVE</p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/70">
                Catch the thrill - live on STATIQ app
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/20" />
                <span className="text-sm font-semibold">VS</span>
                <div className="h-11 w-11 rounded-2xl bg-white/20" />
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">28 December 2025</p>
                <p className="text-white/70">12:00 UTC+3</p>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Saturday, Dec 25</p>
              <div className="flex gap-2">
                <span className="h-2 w-2 rounded-full bg-white/60" />
                <span className="h-2 w-2 rounded-full bg-white/30" />
                <span className="h-2 w-2 rounded-full bg-white/30" />
                <span className="h-2 w-2 rounded-full bg-white/30" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#111730] px-4 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-1 rounded-full bg-[#1520A6]" />
                    <p className="text-sm font-semibold uppercase tracking-wide">
                      Ipswich Town
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-1 rounded-full bg-white/60" />
                    <p className="text-sm font-semibold uppercase tracking-wide">
                      Arsenal
                    </p>
                  </div>
                </div>
                <div className="text-right text-2xl font-semibold">
                  <p>3</p>
                  <p className="text-white/70">2</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>FOX TV+</span>
                <span>FULL TIME</span>
                <span>12:20AM</span>
                <span className="text-[#1520A6]">Live</span>
              </div>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
}
