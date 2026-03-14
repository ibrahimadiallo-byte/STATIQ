import { Header } from "./components/header";
import { TabNavigation } from "./components/tab-navigation";
import { BottomNavigation } from "./components/bottom-navigation";
import { SearchPage } from "./pages/SearchPage";
import { useEffect, useState } from "react";
import { ProfilePage } from "./pages/ProfilePage";
import { ComparePage } from "./pages/ComparePage";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeBottom, setActiveBottom] = useState(0);
  const [activeView, setActiveView] = useState<
    "home" | "explore" | "search" | "profile" | "compare"
  >("home");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView, activeTab]);

  const handleBottomSelect = (index: number) => {
    setActiveBottom(index);
    if (index === 0) setActiveView("home");
    if (index === 1) {
      setActiveView("explore");
      setActiveTab(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f24] text-white">
      <div className="relative max-w-md md:max-w-2xl lg:max-w-3xl mx-auto min-h-screen flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#1520A6]/40 blur-3xl" />
          <div className="absolute top-24 -right-28 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-[#1520A6]/20 blur-3xl" />
        </div>
        <Header />
        {["explore", "search", "profile", "compare"].includes(activeView) && (
          <TabNavigation
            activeIndex={activeTab}
            onTabChange={(index) => {
              setActiveTab(index);
              if (index === 0) setActiveView("explore");
              if (index === 1) setActiveView("search");
              if (index === 2) setActiveView("profile");
              if (index === 3) setActiveView("compare");
            }}
          />
        )}

        <main className="relative flex-1 px-4 pb-6">
          {activeView === "home" && <HomePage />}
          {activeView === "explore" && <ExplorePage />}
          {activeView === "search" && (
            <SearchPage
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSelectPlayer={(playerId) => {
                setSelectedPlayerId(playerId);
                setActiveView("profile");
              }}
            />
          )}
          {activeView === "profile" && <ProfilePage playerId={selectedPlayerId} />}
          {activeView === "compare" && (
            <ComparePage preselectedPlayerId={selectedPlayerId} />
          )}
        </main>

        <BottomNavigation activeIndex={activeBottom} onSelect={handleBottomSelect} />
      </div>
    </div>
  );
}
