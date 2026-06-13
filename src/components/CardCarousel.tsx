import React from "react";
import type { Account, Transaction } from "../services/onedrive";

interface CardCarouselProps {
  accounts: Account[];
  transactions: Transaction[];
  activeAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({
  accounts,
  transactions,
  activeAccountId,
  onSelectAccount,
}) => {
  const calculateAccountBalance = (accountId: string | null) => {
    if (accountId === null) {
      const cashDebitBalance = accounts
        .filter((a) => a.type !== "credit")
        .reduce((sum, a) => {
          const relevantTx = transactions.filter((t) => t.accountId === a.id);
          const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          return sum + (income - expense);
        }, 0);
      const creditDebt = accounts
        .filter((a) => a.type === "credit")
        .reduce((sum, a) => {
          const relevantTx = transactions.filter((t) => t.accountId === a.id);
          const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          return sum + Math.max(0, expense - income);
        }, 0);
      return cashDebitBalance - creditDebt;
    } else {
      const relevantTx = transactions.filter((t) => t.accountId === accountId);
      const income = relevantTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
      const expense = relevantTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
      return income - expense;
    }
  };

  const overallBalance = calculateAccountBalance(null);
  const creditAccounts = accounts.filter((a) => a.type === "credit");
  const totalCreditLimit = creditAccounts.reduce((sum, a) => sum + (a.limit || 0), 0);
  const totalCreditDebt = creditAccounts.reduce((sum, a) => {
    const relevantTx = transactions.filter((t) => t.accountId === a.id);
    const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return sum + Math.max(0, expense - income);
  }, 0);

  const fmtCurrency = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const typeLabel = (type: string) =>
    type === "credit" ? "Credit" : type === "debit" ? "Debit" : "Cash";

  return (
    <div className="w-full flex flex-col gap-3 mb-4">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-sm font-semibold text-text-primary">Accounts</h3>
        <span className="text-[11px] text-text-tertiary">
          {accounts.length + 1} cards
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 px-0.5 snap-x snap-mandatory">
        {/* All Accounts Card */}
        <button
          onClick={() => onSelectAccount(null)}
          className={`snap-start shrink-0 w-64 rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden ${
            activeAccountId === null
              ? "bg-deep-green text-white ring-1 ring-white/10"
              : "glass-panel text-text-secondary"
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium opacity-70 uppercase tracking-wider">All Accounts</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                activeAccountId === null ? "bg-white/10 text-white" : "bg-accent-custom-bg text-accent-custom"
              }`}>
                Σ
              </div>
            </div>
            <div>
              <div className={`text-xl font-bold tabular-nums tracking-tight ${activeAccountId === null ? "text-white" : "text-text-primary"}`}>
                SAR {fmtCurrency(overallBalance)}
              </div>
              <span className="text-[10px] opacity-60">Net Capital</span>
            </div>
            {totalCreditLimit > 0 && (
              <div className="w-full">
                <div className={`w-full h-1 rounded-full overflow-hidden ${activeAccountId === null ? "bg-white/15" : "bg-border-custom/30"}`}>
                  <div
                    className="h-full bg-coral transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, totalCreditLimit > 0 ? (totalCreditDebt / totalCreditLimit) * 100 : 0)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] opacity-50">Debt: SAR {totalCreditDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-[9px] opacity-50">Limit: SAR {totalCreditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Individual Cards */}
        {accounts.map((acc) => {
          const isSelected = activeAccountId === acc.id;
          const isCredit = acc.type === "credit";
          const relevantTx = transactions.filter((t) => t.accountId === acc.id);
          const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const cashBalance = income - expense;
          const outstandingDebt = expense - income;
          const limit = acc.limit || 0;
          const availableCredit = limit - outstandingDebt;
          const usagePercentage = limit > 0 ? Math.min(100, Math.max(0, (outstandingDebt / limit) * 100)) : 0;

          return (
            <button
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`snap-start shrink-0 w-64 rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? `bg-gradient-to-br ${acc.color} text-white ring-1 ring-white/10`
                  : "glass-panel text-text-secondary"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${isSelected ? "text-white/70" : "text-text-tertiary"}`}>
                      {typeLabel(acc.type)}
                    </span>
                    <div className={`text-sm font-bold mt-0.5 ${isSelected ? "text-white" : "text-text-primary"}`}>
                      {acc.name}
                    </div>
                  </div>
                  <div className={`text-[10px] font-mono tracking-wider ${isSelected ? "text-white/50" : "text-text-tertiary"}`}>
                    •••• {acc.lastFour}
                  </div>
                </div>

                <div>
                  <div className={`text-xl font-bold tabular-nums tracking-tight ${isSelected ? "text-white" : "text-text-primary"}`}>
                    SAR {fmtCurrency(isCredit ? availableCredit : cashBalance)}
                  </div>
                  {isCredit && (
                    <span className={`text-[10px] ${isSelected ? "text-white/60" : "text-text-tertiary"}`}>
                      Spent {fmtCurrency(Math.max(0, outstandingDebt))} of {fmtCurrency(limit)}
                    </span>
                  )}
                </div>

                {isCredit && (
                  <div className={`w-full h-1 rounded-full overflow-hidden ${isSelected ? "bg-white/15" : "bg-border-custom/30"}`}>
                    <div
                      className="h-full bg-coral transition-all duration-500 rounded-full"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                )}

                {acc.expiry && (
                  <span className={`text-[9px] ${isSelected ? "text-white/50" : "text-text-tertiary"}`}>
                    Exp {acc.expiry}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CardCarousel;
