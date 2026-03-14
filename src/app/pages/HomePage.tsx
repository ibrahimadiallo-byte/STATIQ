import { useEffect, useState } from "react";

type WorldCupInfo = {
  name: string;
  startDate: string;
  hosts: string[];
  totalTeams: number;
  countdown: { days: number; hours: number; minutes: number };
};

export function HomePage() {
  const [wcInfo, setWcInfo] = useState<WorldCupInfo | null>(null);

  useEffect(() => {
    fetch("/api/world-cup/info")
      .then((r) => r.json())
      .then(setWcInfo)
      .catch(() => {});
  }, []);

  const countdown = wcInfo?.countdown;

  return (
    <section className="pb-6">
      {/* Hero Section */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1520A6] via-[#1b2a7a] to-[#0f152d] p-6 md:p-8 shadow-lg overflow-hidden relative">
        {/* Background logo watermark */}
        <img 
          src="/logo.png" 
          alt="" 
          className="absolute -right-10 -bottom-10 w-48 h-48 opacity-20 pointer-events-none"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="STATIQ" 
              className="w-14 h-14 rounded-2xl shadow-lg"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-medium">
                AI-Powered Sports Analytics
              </p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                STATIQ
              </h1>
            </div>
          </div>
          <p className="mt-4 text-base text-white/80 leading-relaxed max-w-md">
            Search any player. Get instant AI insights in plain language. 
            Compare side-by-side. The difference between data and intelligence.
          </p>
        </div>
      </div>

      {/* World Cup Countdown */}
      {wcInfo && countdown && countdown.days > 0 && (
        <div className="mt-5 rounded-2xl bg-[#111730] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                {wcInfo.name}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {wcInfo.hosts.join(" · ")}
              </p>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-[#1520A6]/30 rounded-xl px-3 py-2">
                <p className="text-xl font-bold">{countdown.days}</p>
                <p className="text-[10px] text-white/50 uppercase">days</p>
              </div>
              <div className="bg-[#1520A6]/30 rounded-xl px-3 py-2">
                <p className="text-xl font-bold">{countdown.hours}</p>
                <p className="text-[10px] text-white/50 uppercase">hrs</p>
              </div>
              <div className="bg-[#1520A6]/30 rounded-xl px-3 py-2">
                <p className="text-xl font-bold">{countdown.minutes}</p>
                <p className="text-[10px] text-white/50 uppercase">min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Core MVP Features */}
      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
          Core Features
        </p>
        <div className="mt-4 space-y-3">
          
          {/* Feature 1: Player Search */}
          <div className="rounded-2xl bg-[#111730] p-4 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#1520A6] flex items-center justify-center text-xl flex-shrink-0">
                🔍
              </div>
              <div>
                <p className="font-semibold">Player Search</p>
                <p className="mt-1 text-sm text-white/60 leading-relaxed">
                  Search any professional football player by name. Access 13,000+ players from top leagues worldwide.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2: Player Profile */}
          <div className="rounded-2xl bg-[#111730] p-4 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#1520A6] flex items-center justify-center text-xl flex-shrink-0">
                📊
              </div>
              <div>
                <p className="font-semibold">Player Profile</p>
                <p className="mt-1 text-sm text-white/60 leading-relaxed">
                  Aggregated key stats from multiple data sources in one clean view — goals, assists, xG, xA, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: AI Insight Report */}
          <div className="rounded-2xl bg-[#111730] p-4 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#1520A6] flex items-center justify-center text-xl flex-shrink-0">
                🤖
              </div>
              <div>
                <p className="font-semibold">AI Insight Report</p>
                <p className="mt-1 text-sm text-white/60 leading-relaxed">
                  AI-generated plain language summary explaining what the numbers actually mean — not just data, but intelligence.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4: Player Comparison */}
          <div className="rounded-2xl bg-[#111730] p-4 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#1520A6] flex items-center justify-center text-xl flex-shrink-0">
                ⚖️
              </div>
              <div>
                <p className="font-semibold">Player vs Player</p>
                <p className="mt-1 text-sm text-white/60 leading-relaxed">
                  Side-by-side comparison of two players with AI-generated context — see who's ahead and why.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Problem Statement */}
      <div className="mt-6 rounded-2xl bg-[#0f152d] border border-white/10 p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
          The Problem We Solve
        </p>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          Sports data is scattered across a dozen platforms. You need ESPN for scores, 
          FBref for advanced stats, Transfermarkt for values. Even then, you're just 
          looking at raw numbers — you still have to figure out what they mean yourself.
        </p>
        <p className="mt-3 text-sm text-white/90 font-medium">
          STATIQ brings it all together and tells you what it means — in plain language.
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-6 text-center">
        <p className="text-xs text-white/40">
          Built for the FIFA World Cup 2026 · Football/Soccer Focus
        </p>
      </div>
    </section>
  );
}
