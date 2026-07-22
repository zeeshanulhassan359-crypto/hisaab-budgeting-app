import React from "react";
import { Home as HomeIcon, TrendingUp, Settings as SettingsIcon, HandCoins } from "lucide-react";
import { HisaabLogo } from "../HisaabLogo";

interface DesktopLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: HomeIcon },
  { id: "investments", label: "Investments", icon: TrendingUp },
  { id: "lending", label: "Lending Tracker", icon: HandCoins },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  activePage,
  setActivePage,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-bg-app transition-colors duration-300">
      {/* Full navigation sidebar — expanded with labels, not icon-only */}
      <aside className="w-[240px] border-r border-border-custom flex flex-col py-8 px-4 gap-1 shrink-0 sticky top-0 h-screen z-40 bg-bg-card">
        {/* Brand block */}
        <div className="flex items-center gap-3 px-3 mb-8 h-12 overflow-visible">
          <HisaabLogo size={42} />
        </div>

        {/* Navigation items with labels */}
        <nav className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest px-3 mb-2">
            Menu
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer w-full text-left ${
                  isActive
                    ? "bg-accent-custom text-accent-custom-fg"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
                aria-label={item.label}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer attribution */}
        <div className="px-3 pt-4 border-t border-border-custom">
          <span className="text-[10px] text-text-tertiary">
            © 2024 Hisaab
          </span>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full max-w-[1100px] mx-auto px-8 py-8 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;
