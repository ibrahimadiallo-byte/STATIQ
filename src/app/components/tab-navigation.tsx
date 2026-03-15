type TabNavigationProps = {
  activeIndex: number;
  onTabChange: (index: number) => void;
};

export function TabNavigation({ activeIndex, onTabChange }: TabNavigationProps) {
  const tabs = ["EXPLORE", "SEARCH", "WATCH", "COMPARE"];

  return (
    <nav className="px-4 mb-2">
      <div className="flex gap-6 overflow-x-auto pb-1">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(index)}
            className={`min-h-[44px] min-w-[44px] px-2 pb-2 relative text-sm font-semibold tracking-[0.18em] touch-manipulation ${
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
