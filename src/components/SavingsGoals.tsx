import React, { useState } from "react";
import type { Account } from "../services/onedrive";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, PlusCircle, Check } from "lucide-react";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  updatedAt: number;
}

interface SavingsGoalsProps {
  savingsGoals: SavingsGoal[];
  accounts: Account[];
  onContribute: (goalId: string, amount: number, accountId: string) => void;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  savingsGoals,
  accounts,
  onContribute,
}) => {
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [successGoalId, setSuccessGoalId] = useState<string | null>(null);

  // Filter accounts suitable for funding (cash & debit only, no credit cards)
  const fundingAccounts = accounts.filter((a) => a.type !== "credit");

  const handleTriggerContribute = (goalId: string) => {
    setActiveGoalId(activeGoalId === goalId ? null : goalId);
    setContribAmount("");
    setSelectedAccountId(fundingAccounts[0]?.id || "");
  };

  const handleSubmitContribution = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amount = parseFloat(contribAmount);
    if (isNaN(amount) || amount <= 0 || !selectedAccountId) return;

    onContribute(goalId, amount, selectedAccountId);

    setSuccessGoalId(goalId);
    setTimeout(() => {
      setSuccessGoalId(null);
      setActiveGoalId(null);
    }, 1500);

    setContribAmount("");
  };

  const getGoalIcon = (name: string) => {
    if (name.toLowerCase().includes("emergency")) return "🚨";
    if (name.toLowerCase().includes("laptop") || name.toLowerCase().includes("computer")) return "💻";
    if (name.toLowerCase().includes("japan") || name.toLowerCase().includes("trip") || name.toLowerCase().includes("travel")) return "🇯🇵";
    return "🎯";
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <h3 className="text-sm font-bold text-text-primary">Savings Goals & Milestones</h3>
          <span className="text-[10px] text-text-tertiary">Long-term target funds progress</span>
        </div>
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {savingsGoals.map((goal) => {
          const progressPercent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isExpanderOpen = activeGoalId === goal.id;
          const isSuccess = successGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-300 relative overflow-hidden ${
                isExpanderOpen
                  ? "bg-bg-elevated/80 border-accent-custom/50 shadow-md"
                  : "bg-bg-elevated/30 border-transparent hover:bg-bg-elevated/50"
              }`}
            >
              {/* Success animation overlay */}
              {isSuccess && (
                <div className="absolute inset-0 bg-success-custom-bg/95 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-10 animate-fade-in">
                  <Check className="w-6 h-6 text-success-custom animate-bounce" />
                  <span className="text-[10px] font-black text-success-custom">Funded!</span>
                </div>
              )}

              {/* Goal Info */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                    Milestone
                  </span>
                  <span className="text-xs font-bold text-text-primary mt-0.5 flex items-center gap-1.5">
                    <span>{getGoalIcon(goal.name)}</span>
                    <span>{goal.name}</span>
                  </span>
                </div>
                <span className="text-xs font-black text-text-primary tabular-nums">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="flex flex-col gap-1 w-full">
                <div className="w-full h-2 bg-border-custom/30 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-deep-green rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-text-tertiary font-bold tabular-nums mt-0.5">
                  <span>SAR {formatCurrency(goal.currentAmount)}</span>
                  <span>SAR {formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>

              {/* Fund trigger button */}
              {!isExpanderOpen && (
                <button
                  onClick={() => handleTriggerContribute(goal.id)}
                  className="w-full py-1.5 bg-accent-custom-bg hover:bg-accent-custom/10 text-accent-custom font-bold text-[10px] rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Fund Goal
                </button>
              )}

              {/* Expandable Funding Form */}
              {isExpanderOpen && (
                <form
                  onSubmit={(e) => handleSubmitContribution(e, goal.id)}
                  className="flex flex-col gap-2 pt-2 border-t border-border-custom/50 animate-slide-up"
                >
                  <div className="flex flex-col gap-1 text-[10px] text-text-secondary">
                    <label className="text-[9px] text-text-tertiary font-bold">Source Wallet</label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="h-8 rounded-lg bg-bg-card border-transparent text-xs text-text-primary cursor-pointer">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {fundingAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="cursor-pointer text-xs">
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1 text-[10px] text-text-secondary">
                    <label className="text-[9px] text-text-tertiary font-bold">Contribution (SAR)</label>
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={contribAmount}
                        onChange={(e) => setContribAmount(e.target.value)}
                        className="h-8 rounded-lg bg-bg-card border-transparent text-xs font-semibold tabular-nums text-text-primary"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveGoalId(null)}
                    className="text-[9px] text-text-tertiary hover:underline text-center mt-1"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsGoals;
