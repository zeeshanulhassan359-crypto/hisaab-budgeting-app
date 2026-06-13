import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Account, Transaction } from "../services/onedrive";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TransactionInput {
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
  note: string;
}

interface TransactionFormProps {
  onAddTransaction: (transaction: TransactionInput & { accountId: string }) => void;
  accounts: Account[];
  activeAccountId: string | null;
  transactions: Transaction[];
}

export const CATEGORIES = [
  { name: "Salary", icon: "💰", color: "text-green-500 bg-green-500/10" },
  { name: "Food", icon: "🍔", color: "text-amber-500 bg-amber-500/10" },
  { name: "Transport", icon: "🚗", color: "text-blue-500 bg-blue-500/10" },
  { name: "Rent & Bills", icon: "🏠", color: "text-slate-700 bg-slate-700/10" },
  { name: "Investments", icon: "📈", color: "text-cyan-500 bg-cyan-500/10" },
  { name: "Shopping", icon: "🛒", color: "text-rose-500 bg-rose-500/10" },
  { name: "Entertainment", icon: "🎬", color: "text-slate-600 bg-slate-600/10" },
  { name: "Gift", icon: "🎁", color: "text-emerald-500 bg-emerald-500/10" },
  { name: "Others", icon: "•••", color: "text-gray-500 bg-gray-500/10" },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onAddTransaction,
  accounts,
  activeAccountId,
  transactions,
}) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return activeAccountId || accounts[0]?.id || "main_wallet";
  });
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const selectedCard = accounts.find((a) => a.id === selectedAccountId);

  const getSelectedCardStats = () => {
    if (!selectedCard) return { balance: 0, isCredit: false, limit: 0, available: 0 };
    const relevantTx = transactions.filter((t) => t.accountId === selectedCard.id);
    const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    if (selectedCard.type === "credit") {
      const limit = selectedCard.limit || 0;
      const debt = expense - income;
      return { balance: -debt, isCredit: true, limit, available: limit - debt };
    } else {
      const balance = income - expense;
      return { balance, isCredit: false, limit: 0, available: balance };
    }
  };

  const cardStats = getSelectedCardStats();

  useEffect(() => {
    if (activeAccountId) setSelectedAccountId(activeAccountId);
  }, [activeAccountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrors({ amount: "Enter a valid amount" });
      return;
    }
    setErrors({});
    onAddTransaction({
      amount: numericAmount,
      category,
      type,
      date,
      note: note.trim() || `${category} ${type}`,
      accountId: selectedAccountId,
    });
    setAmount("");
    setNote("");
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 1800);
  };

  const fmtCurrency = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filteredCategories = CATEGORIES.filter((cat) => {
    if (type === "income") return ["Salary", "Gift", "Others", "Investments"].includes(cat.name);
    return cat.name !== "Salary";
  });

  return (
    <div className="glass-panel p-6 overflow-hidden relative">
      {/* Success overlay */}
      {isSuccess && (
        <div className="absolute inset-0 bg-bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10 animate-fade-in-up">
          <CheckCircle2 className="w-10 h-10 text-success-custom" />
          <span className="text-sm font-semibold text-text-primary">Added!</span>
        </div>
      )}

      <h2 className="text-sm font-semibold text-text-primary mb-5">New Transaction</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type toggle */}
        <div className="flex p-0.5 bg-bg-elevated rounded-xl">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory("Food"); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-[10px] transition-all duration-300 cursor-pointer ${
              type === "expense"
                ? "bg-expense-custom text-white shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => { setType("income"); setCategory("Salary"); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-[10px] transition-all duration-300 cursor-pointer ${
              type === "income"
                ? "bg-success-custom text-white shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-text-tertiary font-medium">Amount (SAR)</label>
            {selectedCard && (
              <span className="text-[10px] text-text-tertiary tabular-nums">
                {cardStats.isCredit ? "Credit" : "Bal"}: {" "}
                <span className={cardStats.available >= 0 ? "text-success-custom" : "text-expense-custom"}>
                  {fmtCurrency(cardStats.available)}
                </span>
              </span>
            )}
          </div>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors({});
            }}
            placeholder="0.00"
            className={`h-11 rounded-xl bg-bg-elevated border text-text-primary font-semibold tabular-nums placeholder:text-text-tertiary/50 ${
              errors.amount ? "border-expense-custom" : "border-transparent"
            }`}
            required
          />
          {errors.amount && <span className="text-[10px] text-expense-custom">{errors.amount}</span>}

          {/* Over-limit warnings */}
          {type === "expense" && cardStats.isCredit && parseFloat(amount) > cardStats.available && (
            <span className="text-[10px] text-warning-custom bg-warning-custom-bg p-2 rounded-lg">
              ⚠ Exceeds credit by SAR {fmtCurrency(parseFloat(amount) - cardStats.available)}
            </span>
          )}
          {type === "expense" && !cardStats.isCredit && parseFloat(amount) > cardStats.available && (
            <span className="text-[10px] text-warning-custom bg-warning-custom-bg p-2 rounded-lg">
              ⚠ Overdraw by SAR {fmtCurrency(parseFloat(amount) - cardStats.available)}
            </span>
          )}
        </div>

        {/* Account select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-tertiary font-medium">Account</label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="h-11 rounded-xl bg-bg-elevated border-transparent font-medium text-text-primary cursor-pointer">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-3 rounded-xs ${acc.color} bg-gradient-to-r border border-white/10`} />
                    <span className="text-xs">{acc.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-tertiary font-medium">Category</label>
          <div className="grid grid-cols-3 gap-1.5">
            {filteredCategories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-accent-custom text-accent-custom-fg shadow-sm"
                      : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-tertiary font-medium">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-xl bg-bg-elevated border-transparent font-medium text-text-primary"
            required
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-tertiary font-medium">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full px-3 py-2.5 bg-bg-elevated rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-custom/30 placeholder:text-text-tertiary/50 resize-none transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full h-11 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-full font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer text-sm"
        >
          Add {type === "income" ? "Income" : "Expense"}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
