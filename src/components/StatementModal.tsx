import React, { useState } from "react";
import { AlertCircle, Calendar, ShieldCheck, Check } from "lucide-react";
import type { Account, Transaction } from "../services/onedrive";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface StatementModalProps {
  isOpen: boolean;
  accounts: Account[];
  transactions: Transaction[];
  onSettlePayment: (creditAccountId: string, amount: number, sourceAccountId: string) => void;
  onDismiss: () => void; // Mark as done for this month
  onSnooze: () => void;   // Prompt again tomorrow
}

export const StatementModal: React.FC<StatementModalProps> = ({
  isOpen,
  accounts,
  transactions,
  onSettlePayment,
  onDismiss,
  onSnooze,
}) => {
  // Find credit accounts with outstanding debt
  const creditCardsWithDebt = accounts
    .filter((a) => a.type === "credit")
    .map((acc) => {
      const relevantTx = transactions.filter((t) => t.accountId === acc.id);
      const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const debt = expense - income;
      return {
        ...acc,
        debt: Math.max(0, debt),
      };
    })
    .filter((card) => card.debt > 0);

  // Available source accounts (cash or debit)
  const sourceAccounts = accounts.filter((a) => a.type === "cash" || a.type === "debit");

  // Local form states
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const selectedCard = creditCardsWithDebt[selectedCardIndex];
  
  const [paymentAmount, setPaymentAmount] = useState<string>(() => {
    return selectedCard ? selectedCard.debt.toFixed(2) : "0";
  });
  
  const [sourceAccountId, setSourceAccountId] = useState<string>(() => {
    return sourceAccounts[0]?.id || "external";
  });

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Sync payment amount default when card index changes
  const handleCardChange = (idx: number) => {
    setSelectedCardIndex(idx);
    const card = creditCardsWithDebt[idx];
    if (card) {
      setPaymentAmount(card.debt.toFixed(2));
    }
  };

  if (creditCardsWithDebt.length === 0) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    onSettlePayment(selectedCard.id, amount, sourceAccountId);
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      onDismiss(); // Mark prompt complete for current month
    }, 1500);
  };

  const currentMonthName = new Date().toLocaleDateString(undefined, { month: "long" });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onSnooze(); }}>
      <DialogContent className="max-w-md rounded-2xl bg-bg-card border border-border-custom p-6 shadow-2xl overflow-hidden" showCloseButton={false}>
        <DialogDescription className="sr-only">
          Modal prompt for settling credit card balances on the 25th of the month.
        </DialogDescription>
        {paymentSuccess && (
          <div className="absolute inset-0 bg-bg-card/95 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 animate-fade-in animate-duration-300">
            <div className="w-16 h-16 rounded-full bg-success-custom-bg flex items-center justify-center text-success-custom shadow-lg">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-lg font-black text-text-primary">Statement Payment Recorded!</h4>
            <p className="text-xs text-text-secondary">Your credit card balance has been adjusted.</p>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-border-custom/50 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-custom-bg text-accent-custom">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-accent-custom font-bold uppercase tracking-wider">
                Monthly Settlement Reminder
              </span>
              <DialogTitle className="text-lg font-black text-text-primary tracking-tight">
                25th Credit Statement Due
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Banner callout */}
        <div className="flex gap-3 bg-accent-custom-bg/30 dark:bg-accent-custom-bg border border-accent-custom/15 rounded-2xl p-4 mb-5 text-xs text-text-secondary leading-relaxed">
          <AlertCircle className="w-5 h-5 text-accent-custom shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="font-bold text-text-primary mb-1">Keep Your Savings Balanced</p>
            It is the 25th of <strong className="text-text-primary">{currentMonthName}</strong>. Pay off credit card debt to accurately calculate your total investable capital.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold text-text-secondary">
          {/* Credit Card Selector */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">
              Select Credit Card to Pay
            </label>
            <div className="flex flex-col gap-2">
              {creditCardsWithDebt.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => handleCardChange(idx)}
                  className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 ${
                    selectedCardIndex === idx
                      ? "border-accent-custom bg-accent-custom-bg/40 shadow-xs"
                      : "border-border-custom hover:border-text-tertiary bg-border-custom/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-6 rounded ${card.color} bg-linear-to-r border border-white/10`} />
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary text-sm">{card.name}</span>
                      <span className="text-[10px] text-text-secondary font-semibold">
                        Limit: SAR {card.limit?.toLocaleString()} (•••• {card.lastFour})
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-text-tertiary uppercase font-bold">Outstanding Debt</span>
                    <span className="font-black text-expense-custom text-sm">
                      SAR {card.debt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Settle Amount */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">
                Payment Amount (SAR)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedCard ? selectedCard.debt : undefined}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3.5 py-3 bg-border-custom/10 border border-border-custom rounded-xl font-bold text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50"
                required
              />
              <div className="flex justify-between px-1">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(selectedCard.debt.toFixed(2))}
                  className="text-[10px] text-accent-custom font-bold hover:underline cursor-pointer"
                >
                  Pay Full Balance
                </button>
              </div>
            </div>

            {/* Settle Source */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">
                Pay From Account
              </label>
              <Select
                value={sourceAccountId}
                onValueChange={setSourceAccountId}
              >
                <SelectTrigger className="w-full h-11 px-3.5 py-3 bg-border-custom/10 border border-border-custom rounded-xl font-bold text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50 cursor-pointer text-xs">
                  <SelectValue placeholder="Select payment source..." />
                </SelectTrigger>
                <SelectContent>
                  {sourceAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-3 rounded-xs ${acc.color} bg-linear-to-r border border-white/10`} />
                        <span>{acc.name} (•••• {acc.lastFour})</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="external" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-3 rounded-xs bg-slate-500 border border-white/10" />
                      <span>External Direct Deposit</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border-custom/50">
            <Button
              type="submit"
              className="w-full h-12 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-2xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              <ShieldCheck className="w-5 h-5" />
              Settle Credit Statement
            </Button>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onSnooze}
                className="h-10 border border-border-custom/50 hover:bg-border-custom/20 rounded-xl font-bold text-text-secondary transition cursor-pointer"
              >
                Remind Me Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onDismiss}
                className="h-10 border border-border-custom/50 hover:bg-border-custom/20 rounded-xl font-bold text-text-secondary transition cursor-pointer"
              >
                Skip This Month
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatementModal;
