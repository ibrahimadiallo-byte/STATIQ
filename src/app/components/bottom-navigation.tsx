import { LayoutGrid, BarChart3, FileText, Trophy, Calendar } from "lucide-react";

export function BottomNavigation() {
  const navItems = [
    { icon: LayoutGrid, label: "Home", active: true },
    { icon: BarChart3, label: "Stats" },
    { icon: FileText, label: "News" },
    { icon: Trophy, label: "Leagues" },
    { icon: Calendar, label: "Schedule" },
  ];

  return (
    <nav className="bg-[#0b0f24] border-t border-white/10 px-4 py-3">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 ${
              item.active ? "text-white" : "text-white/50"
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                item.active ? "bg-[#1520A6]" : "bg-white/5"
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
