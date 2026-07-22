import React from "react";
import { FolderOpen, RefreshCw, TrendingUp, TrendingDown, LogOut, FolderClosed } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import type { Transaction, Account } from "../services/onedrive";
import type { UserProfile } from "../pages/Landing";

interface HeaderProps {
  transactions: Transaction[];
  accounts: Account[];
  activeAccountId: string | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  user: { name: string; isPermissionNeeded?: boolean } | null;
  onLogin: () => void; // Connected to folder connection function
  onLogout: () => void; // Connected to folder disconnection function
  syncStatus: string;
  isSyncing: boolean;
  onSync: () => void;
  activePage: string;
  profile: UserProfile | null;
  onLogoutProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  transactions,
  accounts,
  activeAccountId,
  theme,
  toggleTheme,
  user,
  onLogin,
  onLogout,
  syncStatus,
  isSyncing,
  onSync,
  activePage,
  profile,
  onLogoutProfile,
}) => {
  // Calculations
  let displayBalance: number;
  let displayIncome: number;
  let displayExpense: number;

  if (activeAccountId === null) {
    const cashDebitBalance = accounts
      .filter((a) => a.type !== "credit")
      .reduce((sum, a) => {
        const relevantTx = transactions.filter((t) => t.accountId === a.id);
        const inc = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const exp = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        return sum + (inc - exp);
      }, 0);

    const creditDebt = accounts
      .filter((a) => a.type === "credit")
      .reduce((sum, a) => {
        const relevantTx = transactions.filter((t) => t.accountId === a.id);
        const inc = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const exp = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        return sum + Math.max(0, exp - inc);
      }, 0);

    displayBalance = cashDebitBalance - creditDebt;
    displayIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    displayExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  } else {
    const activeAccount = accounts.find((a) => a.id === activeAccountId);
    const relevantTx = transactions.filter((t) => t.accountId === activeAccountId);
    const inc = relevantTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const exp = relevantTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    displayIncome = inc;
    displayExpense = exp;

    if (activeAccount && activeAccount.type === "credit") {
      const outstandingDebt = exp - inc;
      const limit = activeAccount.limit || 0;
      displayBalance = limit - outstandingDebt;
    } else {
      displayBalance = inc - exp;
    }
  }

  const balanceLabel =
    activeAccountId === null
      ? "Net Capital"
      : accounts.find((a) => a.id === activeAccountId)?.type === "credit"
      ? "Available Credit"
      : "Balance";

  const incomeLabel =
    activeAccountId !== null && accounts.find((a) => a.id === activeAccountId)?.type === "credit"
      ? "Settled"
      : "Income";

  const expenseLabel =
    activeAccountId !== null && accounts.find((a) => a.id === activeAccountId)?.type === "credit"
      ? "Charged"
      : "Spent";

  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pageTitle =
    activePage === "home" ? "Dashboard" : activePage === "investments" ? "Investments" : "Settings";

  return (
    <header className="w-full flex flex-col gap-6 mb-8 animate-fade-in-up">
      {/* Top bar — Clean, editorial style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
            {pageTitle}
          </h1>
          {user ? (
            <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1.5 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${user.isPermissionNeeded ? "bg-warning-custom animate-pulse" : "bg-success-custom"}`} />
              {user.isPermissionNeeded ? "Re-authorize folder sync" : syncStatus}
            </p>
          ) : (
            <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full inline-block bg-text-tertiary" />
              Sync status: Local vault (offline)
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Folder Sync Connector Toggle */}
          <button
            onClick={user ? onLogout : onLogin}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
              user 
                ? "text-success-custom bg-success-custom-bg/25 border border-success-custom/20 hover:opacity-90" 
                : "text-text-tertiary bg-bg-elevated/40 hover:bg-bg-elevated hover:text-text-primary border border-border-custom/30"
            }`}
            title={user ? `Disconnect Folder (${user.name})` : "Connect Local Folder Sync"}
            aria-label="Folder Sync"
          >
            {user ? <FolderOpen className="w-4 h-4" /> : <FolderClosed className="w-4 h-4" />}
          </button>

          {user && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200 cursor-pointer ${
                isSyncing ? "animate-spin" : ""
              }`}
              title={user.isPermissionNeeded ? "Click to grant folder permission" : syncStatus}
              aria-label="Sync"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          {/* User Profile Info & Sign Out */}
          {profile && (
            <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-border-custom/50">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white bg-linear-to-tr from-accent-custom to-indigo-600 shadow-md relative shrink-0 overflow-hidden"
                title={`${profile.name} (${profile.email}) - Provider: ${profile.provider}`}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                )}
                
                {/* Small Provider Indicator Badge */}
                <div className={`absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 rounded-full border border-bg-card ${
                  profile.provider === "google" 
                    ? "bg-[#EA4335]" 
                    : profile.provider === "microsoft" 
                    ? "bg-[#05a6f0]" 
                    : "bg-text-primary"
                }`} />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-bold text-text-primary leading-tight">
                  {profile.name}
                </span>
                <span className="text-[8px] font-semibold text-text-tertiary uppercase tracking-wider leading-none">
                  {profile.provider} Profile
                </span>
              </div>

              <button
                onClick={onLogoutProfile}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-expense-custom hover:bg-expense-custom-bg/25 transition-all duration-200 cursor-pointer"
                title="Sign Out Profile"
                aria-label="Logout Profile"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards — Flat bordered cards per design system */}
      {activePage === "home" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Balance */}
          <div className="glass-panel p-5 flex flex-col gap-1">
            <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">{balanceLabel}</span>
            <span className={`text-2xl font-semibold tabular-nums tracking-tight ${displayBalance >= 0 ? "text-text-primary" : "text-expense-custom"}`} style={{ fontFamily: 'var(--font-display)' }}>
              SAR {formatCurrency(displayBalance)}
            </span>
          </div>

          {/* Income */}
          <div className="glass-panel p-5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-success-custom" />
              <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">{incomeLabel}</span>
            </div>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-success-custom" style={{ fontFamily: 'var(--font-display)' }}>
              SAR {formatCurrency(displayIncome)}
            </span>
          </div>

          {/* Expense */}
          <div className="glass-panel p-5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-expense-custom" />
              <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">{expenseLabel}</span>
            </div>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-expense-custom" style={{ fontFamily: 'var(--font-display)' }}>
              SAR {formatCurrency(displayExpense)}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
