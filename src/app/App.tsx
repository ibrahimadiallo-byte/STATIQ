import { TabNavigation } from "./components/tab-navigation";
import { BottomNavigation } from "./components/bottom-navigation";
import { SearchPage } from "./pages/SearchPage";
import { useEffect, useState } from "react";
import { ProfilePage } from "./pages/ProfilePage";
import { ComparePage } from "./pages/ComparePage";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { FixturesPage } from "./pages/FixturesPage";
import { FeaturedPlayersPage } from "./pages/FeaturedPlayersPage";

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeBottom, setActiveBottom] = useState(0);
  const [activeView, setActiveView] = useState<
    "home" | "explore" | "fixtures" | "search" | "featured" | "profile" | "compare"
  >("home");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView, activeTab]);

  useEffect(() => {
    document.title =
      activeView === "home"
        ? "STATIQ – Data to Intelligence"
        : "STATIQ - AI-Powered Sports Analytics";
  }, [activeView]);

  // Keep Search tab selected when viewing search (prevent switch to Watch when selecting a player)
  useEffect(() => {
    if (activeView === "search" && activeTab !== 1) setActiveTab(1);
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
        {["explore", "search", "featured", "profile", "compare"].includes(activeView) && (
          <TabNavigation
            activeIndex={activeTab}
            onTabChange={(index) => {
              setActiveTab(index);
              if (index === 0) setActiveView("explore");
              if (index === 1) setActiveView("search");
              if (index === 2) {
                setActiveView("featured");
                setSelectedPlayerId(null);
              }
              if (index === 3) setActiveView("compare");
            }}
          />
        )}

        <main className="relative flex-1 px-4 pb-6">
          {activeView === "home" && (
            <HomePage
              onGetStarted={() => {
                setActiveBottom(1);
                setActiveView("explore");
                setActiveTab(0);
              }}
            />
          )}
          {activeView === "explore" && (
            <ExplorePage
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onGoToSearch={(query) => {
                setSearchQuery(query || "");
                setActiveView("search");
                setActiveTab(1);
              }}
              onSelectPlayer={(playerId, playerName) => {
                setSearchQuery(playerName ?? "");
                setSelectedPlayerId(playerId);
                setActiveView("search");
                setActiveTab(1);
              }}
              onViewAllFixtures={() => setActiveView("fixtures")}
            />
          )}
          {activeView === "fixtures" && (
            <FixturesPage
              onBack={() => setActiveView("explore")}
              onSearchPlayers={() => {
                setActiveView("search");
                setActiveTab(1);
              }}
            />
          )}
          {activeView === "search" && (
            <SearchPage
              query={searchQuery}
              onQueryChange={setSearchQuery}
              initialPlayerId={selectedPlayerId}
              onClearSelection={() => setSelectedPlayerId(null)}
              onCompareWithAnother={(playerId) => {
                setSelectedPlayerId(playerId);
                setActiveView("compare");
                setActiveTab(3);
              }}
            />
          )}
          {activeView === "featured" && (
            <FeaturedPlayersPage
              onSelectPlayer={(playerId) => {
                setSelectedPlayerId(playerId);
                setActiveView("profile");
                setActiveTab(2);
              }}
            />
          )}
          {activeView === "profile" && (
            <ProfilePage
              playerId={selectedPlayerId}
              onBack={() => {
                setSelectedPlayerId(null);
                setActiveView("featured");
                setActiveTab(2);
              }}
              onCompareWithAnother={() => {
                setActiveView("compare");
                setActiveTab(3);
              }}
            />
          )}
          {activeView === "compare" && (
            <ComparePage preselectedPlayerId={selectedPlayerId} />
          )}
        </main>

        <BottomNavigation activeIndex={activeBottom} onSelect={handleBottomSelect} />
      </div>
    </div>
  );
}
