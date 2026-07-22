import React from "react";
import type { Account, Transaction } from "../services/onedrive";

interface CardCarouselProps {
  accounts: Account[];
  transactions: Transaction[];
  activeAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

// Microchip element for card realism
const CardChip: React.FC = () => (
  <div className="w-7 h-5 bg-linear-to-br from-[#ffd700] via-[#d4af37] to-[#b8860b] rounded-[3px] border border-[#ffd700]/40 shadow-inner relative overflow-hidden shrink-0">
    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/30" />
    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/30" />
    <div className="absolute top-1 left-2 right-2 bottom-1 border border-black/10 rounded-[1px]" />
  </div>
);

// Map bank names/colors to real Saudi Bank inspired designs
const getCardDesign = (colorClass: string, name: string) => {
  const n = name.toLowerCase();
  const c = colorClass.toLowerCase();

  // 1. SNB AlAhli (Green & Gold)
  if (n.includes("snb") || n.includes("ahli") || c.includes("005030")) {
    return {
      gradient: "from-[#004e2e] via-[#00603a] to-[#003820]",
      bankName: "SNB الأهلي",
      textColor: "text-white",
      logoColor: "text-[#c59b27]",
      logo: (
        <svg className="w-6 h-6 fill-current text-[#c59b27] shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#c59b27" strokeWidth="1.5" fill="none" />
          <path d="M12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c2.25 0 4.24-1.06 5.5-2.71L12 12V5z" opacity="0.15" />
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5c1.7 0 3.19-.85 4.01-2.15L12 12V7z" />
          <path d="M12 12l4.5 2.2c.3-.65.5-1.37.5-2.2 0-2.76-2.24-5-5-5v5z" fill="#c59b27" />
        </svg>
      ),
      pattern: (
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none overflow-hidden">
          <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full border-2 border-dashed border-[#c59b27] scale-150" />
          <div className="absolute bottom-[20px] left-[-10px] w-32 h-[1px] bg-white rotate-[35deg]" />
        </div>
      ),
    };
  }

  // 2. Al Rajhi Bank (Deep Blue & White Icon)
  if (n.includes("rajhi") || c.includes("004b87")) {
    return {
      gradient: "from-[#004b87] to-[#071c49]",
      bankName: "al rajhi bank",
      textColor: "text-white",
      logoColor: "text-white",
      logo: (
        <svg className="w-6 h-6 fill-none stroke-current stroke-[2.5] text-white shrink-0" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
        </svg>
      ),
      pattern: (
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none overflow-hidden">
          <div className="w-full h-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>
      ),
    };
  }

  // 3. Alinma Bank (Bronze Gold & Sand)
  if (n.includes("inma") || c.includes("b2975e")) {
    return {
      gradient: "from-[#a5864e] via-[#bd9f66] to-[#45361d]",
      bankName: "alinma bank",
      textColor: "text-white",
      logoColor: "text-white",
      logo: (
        <svg className="w-6 h-6 fill-none stroke-current stroke-2 text-white shrink-0" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 20h20L12 3zm0 4.5l6 10h-12l6-10z" />
        </svg>
      ),
      pattern: (
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_1px,transparent_8px)]" />
        </div>
      ),
    };
  }

  // 4. Riyad Bank (Copper Orange)
  if (n.includes("riyad") || c.includes("e57e22")) {
    return {
      gradient: "from-[#d36a10] via-[#e67e22] to-[#6d3000]",
      bankName: "riyad bank",
      textColor: "text-white",
      logoColor: "text-white",
      logo: (
        <svg className="w-6 h-6 fill-none stroke-current stroke-[2.5] text-white shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      ),
      pattern: (
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
          <div className="absolute top-[10px] left-[10px] w-36 h-36 rounded-full border-[8px] border-white" />
        </div>
      ),
    };
  }

  // 5. SABB Awwal Bank (Intense Red & White)
  if (n.includes("sabb") || n.includes("awwal") || c.includes("d20a11")) {
    return {
      gradient: "from-[#c10006] via-[#d60e15] to-[#590104]",
      bankName: "sabb awwal",
      textColor: "text-white",
      logoColor: "text-white",
      logo: (
        <svg className="w-6 h-6 fill-none stroke-current stroke-2 text-white shrink-0" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 12l10 10 10-10L12 2zm0 3.5l7 6.5-7 6.5-7-6.5 7-6.5z" />
        </svg>
      ),
      pattern: (
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none overflow-hidden">
          <div className="w-full h-full bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_75%,#fff_75%,#fff)] bg-[size:16px_16px]" />
        </div>
      ),
    };
  }

  // 6. Leather Walnut Cash Wallet / Other
  return {
    gradient: colorClass.includes("from") ? colorClass : "from-[#2f2720] via-[#3a3027] to-[#120e0a]",
    bankName: name || "Cash Vault",
    textColor: "text-white",
    logoColor: "text-amber-500",
    logo: (
      <svg className="w-5 h-5 fill-none stroke-current stroke-[2] text-amber-500 shrink-0" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 11h-4a2 2 0 000 4h4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="13" r="0.5" fill="currentColor" />
      </svg>
    ),
    pattern: (
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
        <div className="w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:6px_6px]" />
      </div>
    ),
  };
};

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
    type === "credit" ? "Credit Card" : type === "debit" ? "Debit Card" : "Cash Wallet";

  return (
    <div className="w-full flex flex-col gap-3 mb-4">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-sm font-semibold text-text-primary">Accounts & Cards</h3>
        <span className="text-[11px] text-text-tertiary">
          {accounts.length + 1} active vaults
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 px-0.5 snap-x snap-mandatory">
        
        {/* All Accounts Carbon Fiber Centurion Premium Card */}
        <button
          onClick={() => onSelectAccount(null)}
          className={`snap-start shrink-0 w-64 h-[155px] rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden select-none cursor-pointer flex flex-col justify-between ${
            activeAccountId === null
              ? "bg-linear-to-br from-[#1c1e21] to-[#0a0b0c] text-white shadow-2xl scale-[1.03] border border-white/20 z-10"
              : "bg-linear-to-br from-[#1c1e21] to-[#0a0b0c] text-white/80 opacity-60 hover:opacity-85 hover:scale-[1.01] shadow-md border border-white/5"
          }`}
        >
          {/* Carbon Fiber Overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_75%,#fff_75%,#fff)] bg-[size:10px_10px]" />
          </div>

          <div className="flex items-start justify-between z-10">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#ffd700] opacity-90">BLACK CARD EDITION</span>
              <h4 className="text-sm font-bold mt-0.5">Net Portfolio</h4>
            </div>
            {/* Sigma Shield Gold Badge */}
            <div className="w-8 h-8 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/25 flex items-center justify-center text-[#ffd700] font-black text-sm">
              Σ
            </div>
          </div>

          <div className="z-10">
            <div className="text-xl font-black tabular-nums tracking-tight">
              SAR {fmtCurrency(overallBalance)}
            </div>
            <span className="text-[9px] opacity-60">Consolidated Capital</span>
          </div>

          {totalCreditLimit > 0 && (
            <div className="w-full z-10">
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ffd700] transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (totalCreditDebt / totalCreditLimit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[8px] opacity-50 font-bold tracking-wider">
                <span>Debt: SAR {totalCreditDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span>Limit: SAR {totalCreditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}
        </button>

        {/* Individual Customized Bank Cards */}
        {accounts.map((acc) => {
          const isSelected = activeAccountId === acc.id;
          const isCredit = acc.type === "credit";
          const isCash = acc.type === "cash";
          
          const relevantTx = transactions.filter((t) => t.accountId === acc.id);
          const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const cashBalance = income - expense;
          const outstandingDebt = expense - income;
          const limit = acc.limit || 0;
          const availableCredit = limit - outstandingDebt;
          const usagePercentage = limit > 0 ? Math.min(100, Math.max(0, (outstandingDebt / limit) * 100)) : 0;

          const design = getCardDesign(acc.color, acc.name);

          return (
            <button
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`snap-start shrink-0 w-64 h-[155px] rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden select-none cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `bg-linear-to-br ${design.gradient} text-white shadow-2xl scale-[1.03] border border-white/20 z-10`
                  : `bg-linear-to-br ${design.gradient} text-white/80 opacity-60 hover:opacity-85 hover:scale-[1.01] shadow-md border border-white/5`
              }`}
            >
              {/* Bank-Specific SVG Background Pattern */}
              {design.pattern}

              <div className="flex items-start justify-between z-10 w-full">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                    {typeLabel(acc.type)}
                  </span>
                  <h4 className="text-sm font-black tracking-tight leading-tight capitalize mt-0.5">
                    {design.bankName}
                  </h4>
                </div>
                {/* Bank Custom Logo Badge */}
                {design.logo}
              </div>

              {/* Card smart microchip */}
              {!isCash && (
                <div className="z-10 ml-0.5">
                  <CardChip />
                </div>
              )}

              <div className="z-10 w-full flex justify-between items-end">
                <div>
                  <div className="text-xl font-black tabular-nums tracking-tight">
                    SAR {fmtCurrency(isCredit ? availableCredit : cashBalance)}
                  </div>
                  {isCredit && (
                    <span className="text-[8px] opacity-60 font-bold">
                      Debt: SAR {fmtCurrency(Math.max(0, outstandingDebt))} of {limit.toLocaleString()}
                    </span>
                  )}
                  {!isCredit && (
                    <span className="text-[9px] opacity-60">Available Balance</span>
                  )}
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-mono tracking-wider font-semibold">
                    •••• {acc.lastFour}
                  </span>
                  {acc.expiry && (
                    <span className="text-[8px] opacity-50 font-bold uppercase tracking-wider mt-0.5">
                      Exp {acc.expiry}
                    </span>
                  )}
                </div>
              </div>

              {isCredit && (
                <div className="w-full z-10">
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CardCarousel;
