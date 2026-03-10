export function TabNavigation() {
  const tabs = ["EXPLORE", "STATS", "LINEUP", "H..."];

  return (
    <nav className="px-4 mb-2">
      <div className="flex gap-6 overflow-x-auto pb-1">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`pb-2 relative text-sm font-semibold tracking-[0.18em] ${
              index === 0 ? "text-white" : "text-white/50"
            }`}
          >
            {tab}
            {index === 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
