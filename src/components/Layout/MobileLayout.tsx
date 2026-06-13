import React from "react";
import { Home as HomeIcon, TrendingUp, Settings as SettingsIcon } from "lucide-react";

interface MobileLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  activePage,
  setActivePage,
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen pb-24 bg-bg-app text-text-primary px-4 pt-4 transition-colors duration-300">
      {/* Main content viewport */}
      <main className="flex-1 w-full max-w-md mx-auto">{children}</main>

      {/* Sticky Apple-style bottom tab bar */}
      <nav className="fixed bottom-4 left-4 right-4 bg-bg-card/80 border border-border-custom shadow-card-custom backdrop-blur-lg rounded-2xl p-2 z-50 flex items-center justify-around max-w-md mx-auto transition-all duration-300">
        {/* Home Button */}
        <button
          onClick={() => setActivePage("home")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-300 cursor-pointer ${
            activePage === "home"
              ? "text-accent-custom bg-accent-custom-bg font-bold scale-105"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </button>

        {/* Investments Button */}
        <button
          onClick={() => setActivePage("investments")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-300 cursor-pointer ${
            activePage === "investments"
              ? "text-accent-custom bg-accent-custom-bg font-bold scale-105"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Investments</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActivePage("settings")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-300 cursor-pointer ${
            activePage === "settings"
              ? "text-accent-custom bg-accent-custom-bg font-bold scale-105"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileLayout;
