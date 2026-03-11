const samplePlayers = [
  {
    name: "Kylian Mbappe",
    club: "Real Madrid",
    position: "FW",
    league: "La Liga",
    age: 27,
    form: "Hot",
    value: "$180m",
  },
  {
    name: "Jude Bellingham",
    club: "Real Madrid",
    position: "MF",
    league: "La Liga",
    age: 22,
    form: "Rising",
    value: "$150m",
  },
  {
    name: "Bukayo Saka",
    club: "Arsenal",
    position: "FW",
    league: "Premier League",
    age: 24,
    form: "Sharp",
    value: "$120m",
  },
  {
    name: "Declan Rice",
    club: "Arsenal",
    position: "MF",
    league: "Premier League",
    age: 27,
    form: "Solid",
    value: "$110m",
  },
];

type SearchPageProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectPlayer: (playerName: string) => void;
  isLoading?: boolean;
  hasError?: boolean;
};

export function SearchPage({
  query,
  onQueryChange,
  onSelectPlayer,
  isLoading = false,
  hasError = false,
}: SearchPageProps) {
  const normalizedQuery = query.trim();
  const filteredPlayers =
    normalizedQuery.length === 0
      ? samplePlayers
      : samplePlayers.filter((player) =>
          `${player.name} ${player.club} ${player.league}`
            .toLowerCase()
            .includes(normalizedQuery.toLowerCase())
        );

  const showEmpty =
    !isLoading &&
    !hasError &&
    filteredPlayers.length === 0 &&
    normalizedQuery.length > 0;

  return (
    <section className="pb-6">
      <div className="rounded-2xl bg-[#111730] p-4 shadow-lg">
        <label className="text-xs uppercase tracking-[0.2em] text-white/60">
          Search players
        </label>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1520A6]" />
          <input
            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
            placeholder="Search by name, club, or league"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-semibold">Top Results</p>
        <button className="text-xs uppercase tracking-[0.2em] text-white/50">
          Filters
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={`loading-${index}`}
              className="h-20 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {hasError && (
        <div className="mt-4 rounded-2xl bg-[#2b1630] px-4 py-5 text-sm text-white/80">
          Something went wrong. Please try again.
        </div>
      )}

      {showEmpty && (
        <div className="mt-4 rounded-2xl bg-white/5 px-4 py-5 text-sm text-white/70">
          No players found for “{normalizedQuery}”.
        </div>
      )}

      {!isLoading && !hasError && filteredPlayers.length > 0 && (
        <div className="mt-4 space-y-3">
          {filteredPlayers.map((player) => (
          <button
            key={player.name}
            className="w-full rounded-2xl bg-[#0f152d] px-4 py-4 text-left shadow-lg transition hover:bg-[#1520A6]/20"
            onClick={() => onSelectPlayer(player.name)}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{player.name}</p>
                <p className="text-xs text-white/60">{player.club}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                {player.position}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span className="rounded-full bg-white/10 px-2.5 py-1">
                {player.league}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">
                Age {player.age}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">
                Form {player.form}
              </span>
              <span className="rounded-full bg-[#1520A6]/30 px-2.5 py-1 text-white">
                {player.value}
              </span>
            </div>
          </button>
          ))}
        </div>
      )}
    </section>
  );
}
