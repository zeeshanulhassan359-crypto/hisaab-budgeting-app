import React, { useState } from "react";
import type { Account } from "../services/onedrive";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, PlusCircle, Check, Trash2, History, ChevronDown, ChevronUp, Plus } from "lucide-react";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  updatedAt: number;
  status?: "active" | "completed" | "deleted";
  createdAt?: number;
  completedAt?: number;
}

interface SavingsGoalsProps {
  savingsGoals: SavingsGoal[];
  accounts: Account[];
  onContribute: (goalId: string, amount: number, accountId: string) => void;
  onAddGoal?: (name: string, targetAmount: number) => void;
  onDeleteGoal?: (id: string) => void;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  savingsGoals,
  accounts,
  onContribute,
  onAddGoal,
  onDeleteGoal,
}) => {
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [successGoalId, setSuccessGoalId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Filter accounts suitable for funding (cash & debit only, no credit cards)
  const fundingAccounts = accounts.filter((a) => a.type !== "credit");

  // Separate goals into active and history
  const activeGoals = savingsGoals.filter((g) => !g.status || g.status === "active");
  const historyGoals = savingsGoals.filter((g) => g.status === "completed" || g.status === "deleted");
  const completedGoals = historyGoals.filter((g) => g.status === "completed");

  const totalAchievedCount = completedGoals.length;
  const totalSavedInCompleted = completedGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  const handleTriggerContribute = (goalId: string) => {
    setActiveGoalId(activeGoalId === goalId ? null : goalId);
    setContribAmount("");
    setSelectedAccountId(fundingAccounts[0]?.id || "");
    setIsAddingGoal(false);
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

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget);
    if (!newGoalName.trim() || isNaN(target) || target <= 0) return;

    if (onAddGoal) {
      onAddGoal(newGoalName.trim(), target);
    }
    setNewGoalName("");
    setNewGoalTarget("");
    setIsAddingGoal(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this goal? Past contributions will remain in your transaction history.")) {
      if (onDeleteGoal) onDeleteGoal(id);
    }
  };

  const getGoalIcon = (name: string) => {
    if (name.toLowerCase().includes("emergency")) return "🚨";
    if (name.toLowerCase().includes("laptop") || name.toLowerCase().includes("computer")) return "💻";
    if (name.toLowerCase().includes("japan") || name.toLowerCase().includes("trip") || name.toLowerCase().includes("travel")) return "🇯🇵";
    if (name.toLowerCase().includes("car") || name.toLowerCase().includes("vehicle")) return "🚗";
    if (name.toLowerCase().includes("house") || name.toLowerCase().includes("home")) return "🏠";
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
        {activeGoals.map((goal) => {
          const progressPercent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isExpanderOpen = activeGoalId === goal.id;
          const isSuccess = successGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-300 relative overflow-hidden group ${
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
                <div className="flex items-center gap-2">
                  {onDeleteGoal && !isExpanderOpen && (
                    <button
                      onClick={(e) => handleDelete(e, goal.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-tertiary hover:text-expense-custom rounded-md hover:bg-expense-custom-bg"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-xs font-black text-text-primary tabular-nums">
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
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

        {/* Add New Goal Card */}
        {onAddGoal && (
          <div
            className={`p-4 rounded-2xl border border-dashed border-border-custom/60 flex flex-col justify-center transition-all duration-300 ${
              isAddingGoal ? "bg-bg-elevated/50 border-accent-custom/40 shadow-xs" : "hover:bg-bg-elevated/30 hover:border-accent-custom/50 cursor-pointer"
            }`}
            onClick={() => {
              if (!isAddingGoal) {
                setIsAddingGoal(true);
                setActiveGoalId(null);
              }
            }}
          >
            {!isAddingGoal ? (
              <div className="flex flex-col items-center justify-center gap-2 h-full text-text-tertiary group">
                <div className="w-8 h-8 rounded-full bg-border-custom/30 flex items-center justify-center group-hover:bg-accent-custom/10 group-hover:text-accent-custom transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold group-hover:text-text-secondary transition-colors">Create New Goal</span>
              </div>
            ) : (
              <form onSubmit={handleAddGoalSubmit} className="flex flex-col gap-3 animate-fade-in">
                <div className="flex flex-col gap-1 text-[10px] text-text-secondary">
                  <label className="text-[9px] text-text-tertiary font-bold">Goal Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Dream Car"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="h-8 rounded-lg bg-bg-card border-border-custom/50 text-xs text-text-primary"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1 text-[10px] text-text-secondary">
                  <label className="text-[9px] text-text-tertiary font-bold">Target Amount (SAR)</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 50000"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="h-8 rounded-lg bg-bg-card border-border-custom/50 text-xs font-semibold tabular-nums text-text-primary"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingGoal(false);
                      setNewGoalName("");
                      setNewGoalTarget("");
                    }}
                    className="flex-1 py-1.5 border border-border-custom text-text-secondary text-[10px] font-bold rounded-lg hover:bg-border-custom/20 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* History Dashboard */}
      {historyGoals.length > 0 && (
        <div className="mt-2 flex flex-col gap-3 border-t border-border-custom/50 pt-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
              <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                Achieved & Historical Goals
              </span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-text-tertiary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-tertiary" />
            )}
          </button>

          {showHistory && (
            <div className="flex flex-col gap-4 animate-slide-up bg-bg-elevated/20 p-4 rounded-xl border border-border-custom/30">
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="p-3 bg-bg-card border border-border-custom/50 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1">Total Achieved</span>
                  <span className="text-xl font-black text-success-custom tabular-nums">{totalAchievedCount}</span>
                </div>
                <div className="p-3 bg-bg-card border border-border-custom/50 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1">Total Saved</span>
                  <span className="text-xl font-black text-text-primary tabular-nums">SAR {formatCurrency(totalSavedInCompleted)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {historyGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-bg-card rounded-lg border border-border-custom/30 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${goal.status === "completed" ? "bg-success-custom-bg text-success-custom" : "bg-border-custom/30 text-text-secondary"}`}>
                        {getGoalIcon(goal.name)}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                          {goal.name}
                          {goal.status === "deleted" && <span className="text-[8px] bg-border-custom px-1.5 py-0.5 rounded text-text-secondary uppercase">Deleted</span>}
                        </span>
                        <span className="text-[9px] text-text-tertiary font-medium">
                          {goal.completedAt ? `Completed on ${new Date(goal.completedAt).toLocaleDateString()}` : `Created ${goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'Unknown'}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold tabular-nums ${goal.status === "completed" ? "text-success-custom" : "text-text-primary"}`}>
                        SAR {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-[9px] text-text-tertiary">of SAR {formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;

