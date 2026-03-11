type TabNavigationProps = {
  activeIndex: number;
  onTabChange: (index: number) => void;
};

export function TabNavigation({ activeIndex, onTabChange }: TabNavigationProps) {
  const tabs = ["EXPLORE", "SEARCH", "STATS", "LINEUP"];

  return (
    <nav className="px-4 mb-2">
      <div className="flex gap-6 overflow-x-auto pb-1">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => onTabChange(index)}
            className={`pb-2 relative text-sm font-semibold tracking-[0.18em] ${
              index === activeIndex ? "text-white" : "text-white/50"
            }`}
          >
            {tab}
            {index === activeIndex && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
