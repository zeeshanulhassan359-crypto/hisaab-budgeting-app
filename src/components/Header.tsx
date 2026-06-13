import React from "react";
import { LogIn, LogOut, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import type { Transaction, Account } from "../services/onedrive";

interface HeaderProps {
  transactions: Transaction[];
  accounts: Account[];
  activeAccountId: string | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  syncStatus: string;
  isSyncing: boolean;
  onSync: () => void;
  activePage: string;
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
}) => {
  // Calculations
  let displayBalance = 0;
  let displayIncome = 0;
  let displayExpense = 0;

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
          {user && (
            <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-custom inline-block animate-subtle-pulse" />
              {syncStatus}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200 cursor-pointer ${
                isSyncing ? "animate-spin" : ""
              }`}
              title={syncStatus}
              aria-label="Sync"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          {user ? (
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:text-expense-custom hover:bg-expense-custom-bg transition-all duration-200 cursor-pointer"
              title="Sign Out"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="ms-login-btn"
              onClick={onLogin}
              className="flex items-center gap-2 px-4 h-9 bg-accent-custom text-accent-custom-fg rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Connect</span>
            </button>
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
