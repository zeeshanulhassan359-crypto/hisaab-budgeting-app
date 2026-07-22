import React, { useState, useEffect } from "react";
import { HandCoins, UserPlus, Receipt, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle, Plus, RefreshCw } from "lucide-react";
import type { Transaction, Account } from "../services/onedrive";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface LentRecord {
  id: string;
  borrowerName: string;
  borrowerContact?: string;
  amount: number;
  currency: string;
  date: string;
  accountId: string;
  status: "outstanding" | "repaid" | "partial";
  amountRepaid: number;
  notes?: string;
  createdAt: number;
}

interface LendingProps {
  accounts: Account[];
  onAddTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
}

const CURRENCIES = ["SAR", "USD", "EUR", "AED", "QAR", "BHD", "KWD"];

export const Lending: React.FC<LendingProps> = ({
  accounts,
  onAddTransaction,
}) => {
  // Core database state inside localStorage
  const [records, setRecords] = useState<LentRecord[]>(() => {
    const saved = localStorage.getItem("hisaab_lending_records");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn("Failed parsing lending records", err);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("hisaab_lending_records", JSON.stringify(records));
  }, [records]);

  // Form states for creating a new loan
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerContact, setBorrowerContact] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(() => accounts[0]?.id || "");
  const [notes, setNotes] = useState("");
  
  // Repayment form states (for inline repayment modal/drawer)
  const [repayingRecordId, setRepayingRecordId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayAccountId, setRepayAccountId] = useState(() => accounts[0]?.id || "");
  const [repayDate, setRepayDate] = useState(() => new Date().toISOString().split("T")[0]);

  // UI state filters
  const [filterStatus, setFilterStatus] = useState<"all" | "outstanding" | "repaid">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !amount || !accountId) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newRecord: LentRecord = {
      id: "lend_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
      borrowerName: borrowerName.trim(),
      borrowerContact: borrowerContact.trim() || undefined,
      amount: parsedAmount,
      currency,
      date,
      accountId,
      status: "outstanding",
      amountRepaid: 0,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Automatically dispatch an expense transaction to deduct funds from the card balance
    onAddTransaction({
      accountId,
      type: "expense",
      amount: parsedAmount,
      category: "Lent / Debts",
      note: `Lent to ${borrowerName.trim()}${notes.trim() ? `: ${notes.trim()}` : ""}`,
      date,
      updatedAt: Date.now(),
    });

    // Reset Form
    setBorrowerName("");
    setBorrowerContact("");
    setAmount("");
    setNotes("");
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingRecordId || !repayAmount) return;

    const parsedAmount = parseFloat(repayAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === repayingRecordId) {
          const totalPaid = rec.amountRepaid + parsedAmount;
          let status: "outstanding" | "partial" | "repaid" = "partial";
          if (totalPaid >= rec.amount) {
            status = "repaid";
          }
          return {
            ...rec,
            amountRepaid: Math.min(rec.amount, totalPaid),
            status,
          };
        }
        return rec;
      })
    );

    const record = records.find((r) => r.id === repayingRecordId);
    if (record) {
      // Automatically dispatch an income transaction to add funds back to the card balance
      onAddTransaction({
        accountId: repayAccountId,
        type: "income",
        amount: parsedAmount,
        category: "Lent / Debts",
        note: `Repayment from ${record.borrowerName}`,
        date: repayDate,
        updatedAt: Date.now(),
      });
    }

    // Reset inline modal state
    setRepayingRecordId(null);
    setRepayAmount("");
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Are you sure you want to delete this lending record? This will not delete the associated transactions.")) {
      setRecords((prev) => prev.filter((rec) => rec.id !== id));
    }
  };

  // Calculations
  const filteredRecords = records.filter((rec) => {
    const matchesSearch = rec.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "outstanding") return matchesSearch && rec.status !== "repaid";
    return matchesSearch && rec.status === "repaid";
  });

  const totalOriginalLent = records.reduce((sum, rec) => sum + rec.amount, 0);
  const totalRepaidAmount = records.reduce((sum, rec) => sum + rec.amountRepaid, 0);
  const netOutstandingAmount = totalOriginalLent - totalRepaidAmount;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in animate-duration-300">
      {/* Title Header */}
      <div className="flex flex-col gap-1 border-b border-border-custom pb-4">
        <div className="flex items-center gap-2 text-accent-custom">
          <HandCoins className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Lending Tracker</span>
        </div>
        <h2 className="text-2xl font-black text-text-primary tracking-tight">
          Lent Funds Manager
        </h2>
        <p className="text-xs text-text-secondary font-medium">
          Track loans extended to friends, family, or other individuals. Record repayments and keep account balances automatically synchronized.
        </p>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 flex flex-col gap-1 text-left relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <ArrowUpRight className="w-4 h-4 text-expense-custom" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Amount Lent</span>
          </div>
          <span className="text-2xl font-black text-text-primary mt-1">
            SAR {totalOriginalLent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-1 text-left relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <ArrowDownLeft className="w-4 h-4 text-success-custom" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Repayments Recieved</span>
          </div>
          <span className="text-2xl font-black text-success-custom mt-1">
            SAR {totalRepaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-1 text-left relative overflow-hidden border border-accent-custom/20">
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <RefreshCw className="w-4 h-4 text-accent-custom" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Net Outstanding Balance</span>
          </div>
          <span className="text-2xl font-black text-accent-custom mt-1">
            SAR {netOutstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Loan Creation Form */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
            <UserPlus className="w-4 h-4 text-accent-custom" />
            Record New Loan
          </h3>

          <form onSubmit={handleLendSubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Borrower Details (Name)</label>
              <Input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="e.g. Ahmed Al-Malki"
                className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-semibold text-text-primary focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Borrower Contact (Optional)</label>
              <Input
                type="text"
                value={borrowerContact}
                onChange={(e) => setBorrowerContact(e.target.value)}
                placeholder="e.g. +966 50 123 4567"
                className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-semibold text-text-primary focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary font-bold">Amount Lent</label>
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-semibold text-text-primary focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary font-bold">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-bold text-text-primary cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((cur) => (
                      <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Source Payment Account</label>
              {accounts.length === 0 ? (
                <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/15 text-left font-bold">
                  ⚠ No cards/accounts added. Please go to Settings to add one.
                </div>
              ) : (
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-bold text-text-primary cursor-pointer">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} (•••• {acc.lastFour})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Date of Loan</label>
              <div className="relative">
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-bold text-text-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Transaction Details / Notes</label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Travel costs share"
                className="w-full h-10 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-semibold text-text-primary focus:outline-hidden"
              />
            </div>

            <Button
              type="submit"
              disabled={accounts.length === 0}
              className="w-full h-10 bg-accent-custom hover:bg-accent-custom/90 text-accent-custom-fg rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accounts.length === 0 ? (
                <span>Add Card/Account First</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Record & Deduct Funds
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Outstanding Debts list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 border border-border-custom/80 rounded-xl px-3 py-1 bg-border-custom/5 w-full sm:w-64">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search borrower or notes..."
                className="border-0 bg-transparent p-0 text-xs font-bold text-text-primary w-full focus:outline-hidden placeholder:text-text-tertiary"
              />
            </div>

            <div className="flex items-center gap-1 bg-border-custom/10 p-0.5 rounded-xl border border-border-custom/40 shrink-0">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  filterStatus === "all" ? "bg-bg-card text-text-primary shadow-xs" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                All Loans
              </button>
              <button
                onClick={() => setFilterStatus("outstanding")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  filterStatus === "outstanding" ? "bg-bg-card text-text-primary shadow-xs" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Outstanding
              </button>
              <button
                onClick={() => setFilterStatus("repaid")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  filterStatus === "repaid" ? "bg-bg-card text-text-primary shadow-xs" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Fully Repaid
              </button>
            </div>
          </div>

          {/* Records Grid */}
          <div className="flex flex-col gap-4">
            {filteredRecords.length === 0 ? (
              <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-3 text-text-tertiary">
                <Receipt className="w-10 h-10 opacity-30" />
                <span className="text-xs font-medium">No lending records found matching the filters.</span>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const outstanding = rec.amount - rec.amountRepaid;
                const progress = Math.min(100, Math.max(0, (rec.amountRepaid / rec.amount) * 100));
                const targetAccount = accounts.find((a) => a.id === rec.accountId);

                return (
                  <div
                    key={rec.id}
                    className={`glass-panel p-5 text-left flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
                      rec.status === "repaid" ? "opacity-75 border-success-custom/25" : "border-border-custom/50"
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-text-primary">{rec.borrowerName}</h4>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            rec.status === "repaid" 
                              ? "bg-success-custom-bg text-success-custom" 
                              : rec.status === "partial" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : "bg-expense-custom-bg text-expense-custom"
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        {rec.borrowerContact && (
                          <span className="text-[10px] text-text-tertiary font-semibold block mt-0.5">{rec.borrowerContact}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {rec.status !== "repaid" && (
                          <button
                            onClick={() => {
                              setRepayingRecordId(rec.id);
                              setRepayAmount(outstanding.toString());
                              setRepayAccountId(rec.accountId);
                            }}
                            className="h-7 px-3 bg-success-custom/10 hover:bg-success-custom/20 border border-success-custom/20 text-success-custom rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Record Repayment
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="w-7 h-7 bg-expense-custom-bg/25 hover:bg-expense-custom-bg/40 text-expense-custom rounded-lg flex items-center justify-center cursor-pointer transition"
                          title="Delete Loan Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-border-custom/30 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-text-tertiary">Lent Amount</span>
                        <span className="font-bold text-text-primary">
                          {rec.currency} {rec.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-text-tertiary">Repaid to Date</span>
                        <span className="font-bold text-success-custom">
                          {rec.currency} {rec.amountRepaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-text-tertiary">Remaining Debt</span>
                        <span className={`font-bold ${outstanding > 0 ? "text-expense-custom" : "text-text-tertiary"}`}>
                          {rec.currency} {outstanding.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-text-tertiary">Lent Date & Source</span>
                        <span className="font-semibold text-text-secondary truncate">
                          {rec.date} ({targetAccount ? targetAccount.name : "N/A"})
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between text-[10px] text-text-tertiary">
                        <span>Repayment Progress</span>
                        <span className="font-bold">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-border-custom/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-custom transition-all duration-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {rec.notes && (
                      <div className="bg-border-custom/5 border border-border-custom/20 rounded-xl p-2 text-[11px] text-text-secondary font-medium leading-relaxed">
                        <span className="font-black text-text-tertiary uppercase text-[9px] block">Loan Reason:</span>
                        {rec.notes}
                      </div>
                    )}

                    {/* Inline repayment form modal overlay */}
                    {repayingRecordId === rec.id && (
                      <div className="absolute inset-0 bg-bg-card/95 backdrop-blur-xs p-5 flex flex-col justify-between z-20 animate-fade-in">
                        <h5 className="text-sm font-black text-text-primary uppercase tracking-wider border-b border-border-custom/30 pb-1 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-success-custom" /> Record Repayment for {rec.borrowerName}
                        </h5>

                        <form onSubmit={handleRepaySubmit} className="flex flex-col gap-3 text-left my-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-text-tertiary font-bold">Repayment Amount ({rec.currency})</label>
                              <Input
                                type="number"
                                min="0.01"
                                step="any"
                                max={outstanding}
                                required
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                className="w-full h-9 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-semibold text-text-primary focus:outline-hidden"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-text-tertiary font-bold">Receipt Date</label>
                              <Input
                                type="date"
                                required
                                value={repayDate}
                                onChange={(e) => setRepayDate(e.target.value)}
                                className="w-full h-9 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-semibold text-text-primary focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-text-tertiary font-bold">Divert Refund to Account</label>
                            <Select value={repayAccountId} onValueChange={setRepayAccountId}>
                              <SelectTrigger className="w-full h-9 px-3 bg-border-custom/10 border border-border-custom rounded-xl text-xs font-bold text-text-primary cursor-pointer">
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.name} (•••• {acc.lastFour})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <Button
                              type="submit"
                              className="h-9 px-5 bg-success-custom hover:bg-success-custom/90 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                            >
                              Add to Balance
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setRepayingRecordId(null)}
                              variant="outline"
                              className="h-9 px-5 border border-border-custom/50 hover:bg-bg-elevated text-text-secondary rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lending;
