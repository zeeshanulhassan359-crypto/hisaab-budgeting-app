import React from "react";
import type { Transaction, Account } from "../services/onedrive";
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

interface CashFlowMetricsProps {
  transactions: Transaction[];
  accounts: Account[];
  activeAccountId: string | null;
}

export const CashFlowMetrics: React.FC<CashFlowMetricsProps> = ({
  transactions,
  accounts,
  activeAccountId,
}) => {
  // Get current month and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Filter transactions for current month
  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Calculate liquid balance
  const liquidAccounts = accounts.filter((a) => a.type === "cash" || a.type === "debit");
  const creditAccounts = accounts.filter((a) => a.type === "credit");

  const getAccountBalance = (accountId: string) => {
    const relevantTx = transactions.filter((t) => t.accountId === accountId);
    const inc = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  };

  const getCreditCardDebt = (accountId: string) => {
    const relevantTx = transactions.filter((t) => t.accountId === accountId);
    const inc = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return Math.max(0, exp - inc);
  };

  let netLiquidBalance = 0;
  let monthlyInflow = 0;
  let monthlyOutflow = 0;

  if (activeAccountId === null) {
    const totalLiquid = liquidAccounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
    const totalCreditDebt = creditAccounts.reduce((sum, a) => sum + getCreditCardDebt(a.id), 0);
    netLiquidBalance = totalLiquid - totalCreditDebt;

    monthlyInflow = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    monthlyOutflow = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  } else {
    const acc = accounts.find((a) => a.id === activeAccountId);
    if (acc) {
      if (acc.type === "credit") {
        const debt = getCreditCardDebt(acc.id);
        const limit = acc.limit || 0;
        netLiquidBalance = limit - debt;
      } else {
        netLiquidBalance = getAccountBalance(acc.id);
      }
    }

    const accTx = monthlyTransactions.filter((t) => t.accountId === activeAccountId);
    monthlyInflow = accTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    monthlyOutflow = accTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  }

  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-deep-green text-white rounded-[22px] p-6 flex flex-col gap-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-white/60" />
          <span className="text-xs font-medium tracking-wider uppercase text-white/70">
            Cash Flow Metrics
          </span>
        </div>
        <span className="text-[10px] bg-white/10 text-white/60 px-2.5 py-1 rounded-full font-medium tracking-wider uppercase">
          {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Liquid Balance */}
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-[16px] border border-white/8">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
              {activeAccountId === null ? "Net Liquid Balance" : "Available Funds"}
            </span>
            <Wallet className="w-4 h-4 text-white/40" />
          </div>
          <span className="text-2xl font-semibold tracking-tight tabular-nums text-white" style={{ fontFamily: 'var(--font-display)' }}>
            SAR {formatCurrency(netLiquidBalance)}
          </span>
          <span className="text-[10px] text-white/30 font-medium">
            {activeAccountId === null ? "Cash + Debit − Credit Debt" : "Total spendable capacity"}
          </span>
        </div>

        {/* Monthly Inflow */}
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-[16px] border border-white/8">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Monthly Inflow</span>
            <ArrowUpRight className="w-4 h-4 text-white/40" />
          </div>
          <span className="text-2xl font-semibold tracking-tight tabular-nums text-success-custom" style={{ fontFamily: 'var(--font-display)' }}>
            SAR {formatCurrency(monthlyInflow)}
          </span>
          <span className="text-[10px] text-white/30 font-medium">
            Total earnings this month
          </span>
        </div>

        {/* Monthly Outflow */}
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-[16px] border border-white/8">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Monthly Outflow</span>
            <ArrowDownRight className="w-4 h-4 text-coral" />
          </div>
          <span className="text-2xl font-semibold tracking-tight tabular-nums text-coral" style={{ fontFamily: 'var(--font-display)' }}>
            SAR {formatCurrency(monthlyOutflow)}
          </span>
          <span className="text-[10px] text-white/30 font-medium">
            Total expenses this month
          </span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowMetrics;
