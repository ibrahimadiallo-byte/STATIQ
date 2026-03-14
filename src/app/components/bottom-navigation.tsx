import { LayoutGrid, BarChart3 } from "lucide-react";

type BottomNavigationProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function BottomNavigation({ activeIndex, onSelect }: BottomNavigationProps) {
  const navItems = [
    { icon: LayoutGrid, label: "Home" },
    { icon: BarChart3, label: "Stats" },
  ];

  return (
    <nav className="bg-[#0b0f24] border-t border-white/10 px-4 py-3">
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => onSelect(index)}
            className={`flex flex-col items-center gap-1 ${
              activeIndex === index ? "text-white" : "text-white/50"
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                activeIndex === index ? "bg-[#1520A6]" : "bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
