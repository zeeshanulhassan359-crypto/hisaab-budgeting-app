import React, { useState } from "react";
import type { Transaction, Account, SavingsGoal } from "../services/onedrive";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { WeeklyReport } from "../components/WeeklyReport";
import { CardCarousel } from "../components/CardCarousel";
import { Plus, X, AlertCircle } from "lucide-react";
import { CashFlowMetrics } from "../components/CashFlowMetrics";
import { CategoryExpenseChart } from "../components/CategoryExpenseChart";
import { SavingsGoals } from "../components/SavingsGoals";
import { ReceiptScannerModal } from "../components/ReceiptScannerModal";

interface HomeProps {
  transactions: Transaction[];
  accounts: Account[];
  activeAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  onAddTransaction: (t: {
    amount: number;
    category: string;
    type: "income" | "expense";
    date: string;
    note: string;
    accountId: string;
  }) => void;
  onAddTransactionsBatch: (
    txs: Array<{
      amount: number;
      category: string;
      type: "income" | "expense";
      date: string;
      note: string;
      accountId: string;
    }>
  ) => void;
  onDeleteTransaction: (id: string) => void;
  isMobile: boolean;
  onOpenStatementModal?: () => void;
  savingsGoals: SavingsGoal[];
  onContribute: (goalId: string, amount: number, accountId: string) => void;
  onAddGoal: (name: string, targetAmount: number) => void;
  onDeleteGoal: (id: string) => void;
  categoryBudgets: { [key: string]: number };
}

export const Home: React.FC<HomeProps> = ({
  transactions,
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddTransaction,
  onAddTransactionsBatch,
  onDeleteTransaction,
  isMobile,
  onOpenStatementModal,
  savingsGoals,
  onContribute,
  onAddGoal,
  onDeleteGoal,
  categoryBudgets,
}) => {
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Compute transactions filtered by selected card
  const filteredTransactions = activeAccountId
    ? transactions.filter((t) => t.accountId === activeAccountId)
    : transactions;

  // Selected card stats for statement settlement reminder
  const selectedCard = accounts.find((a) => a.id === activeAccountId);
  const creditCardTransactions = activeAccountId ? transactions.filter((t) => t.accountId === activeAccountId) : [];
  const creditIncome = creditCardTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const creditExpense = creditCardTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const outstandingDebt = Math.max(0, creditExpense - creditIncome);

  // Budget Compliance Warnings calculations (current calendar month only)
  const now = new Date();
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(`${t.date}T00:00:00`);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const categorySpent = {
    "Rent & Bills": currentMonthTx.filter((t) => t.category === "Rent & Bills" && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    "Food": currentMonthTx.filter((t) => t.category === "Food" && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    "Entertainment": currentMonthTx.filter((t) => t.category === "Entertainment" && t.type === "expense").reduce((s, t) => s + t.amount, 0),
  };

  const budgetWarnings = Object.keys(categoryBudgets).map((cat) => {
    const spent = categorySpent[cat as keyof typeof categorySpent] || 0;
    const limit = categoryBudgets[cat];
    const exceeded = spent > limit;
    return {
      category: cat,
      spent,
      limit,
      exceeded,
      overAmount: spent - limit,
    };
  }).filter((w) => w.exceeded);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-5 w-full">
        {/* Visual Card Carousel at the top */}
        <CardCarousel
          accounts={accounts}
          transactions={transactions}
          activeAccountId={activeAccountId}
          onSelectAccount={onSelectAccount}
        />

        {/* Dynamic Cash Flow Metrics Panel */}
        <CashFlowMetrics
          transactions={transactions}
          accounts={accounts}
          activeAccountId={activeAccountId}
        />

        {/* Category Compliance Alerts */}
        {budgetWarnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {budgetWarnings.map((warning) => (
              <div
                key={warning.category}
                className="mx-1 p-3.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-2xl flex items-center justify-between animate-fade-in text-left"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[11px] flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Limit Exceeded: {warning.category}
                  </span>
                  <span className="text-[9px] text-text-secondary font-medium">
                    Spent: <strong>SAR {warning.spent.toLocaleString()}</strong> of limit: <strong>SAR {warning.limit.toLocaleString()}</strong>
                  </span>
                </div>
                <span className="text-[9px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-md shrink-0">
                  +SAR {warning.overAmount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Interactive SVG Category Chart */}
        <CategoryExpenseChart transactions={filteredTransactions} />

        {/* Savings Goals */}
        <SavingsGoals
          savingsGoals={savingsGoals}
          accounts={accounts}
          onContribute={onContribute}
          onAddGoal={onAddGoal}
          onDeleteGoal={onDeleteGoal}
        />

        {/* Weekly Report Dashboard Summary (filtered to active card) */}
        <WeeklyReport transactions={filteredTransactions} />

        {/* Dynamic Credit Card Payment Banner */}
        {activeAccountId && selectedCard?.type === "credit" && outstandingDebt > 0 && onOpenStatementModal && (
          <div className="mx-1 glass-panel p-4 bg-action-blue/5 dark:bg-action-blue/10 border border-action-blue/15 rounded-2xl flex items-center justify-between animate-fade-in animate-duration-300">
            <div className="flex flex-col text-left gap-0.5">
              <span className="font-bold text-xs flex items-center gap-1.5 text-action-blue">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" /> Credit Statement Due
              </span>
              <span className="text-[10px] text-text-secondary font-medium">
                Outstanding Balance: <strong>SAR {outstandingDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </span>
            </div>
            <button
              onClick={onOpenStatementModal}
              className="px-3.5 py-1.5 bg-accent-custom hover:opacity-90 text-accent-custom-fg font-medium rounded-full text-[10px] cursor-pointer transition shrink-0"
            >
              Pay Now
            </button>
          </div>
        )}

        {/* Transaction History list */}
        <TransactionList
          transactions={filteredTransactions}
          accounts={accounts}
          onDeleteTransaction={onDeleteTransaction}
        />

        {/* Floating Add Button for Mobile */}
        <button
          onClick={() => setShowMobileForm(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-300 z-40"
          title="Add new transaction"
          aria-label="Add transaction button"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Mobile Full Screen Drawer for adding transaction */}
        {showMobileForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center animate-fade-in animate-duration-300">
            <div className="w-full max-w-md bg-bg-card rounded-t-3xl p-5 shadow-2xl relative border-t border-border-custom animate-slide-up">
              {/* Close Button */}
              <button
                onClick={() => setShowMobileForm(false)}
                className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary bg-border-custom/20 rounded-full cursor-pointer"
                aria-label="Close form"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mt-4">
                <TransactionForm
                  accounts={accounts}
                  activeAccountId={activeAccountId}
                  transactions={transactions}
                  onAddTransaction={(tx) => {
                    onAddTransaction(tx);
                    setTimeout(() => setShowMobileForm(false), 800);
                  }}
                  onOpenReceiptScanner={() => {
                    setShowMobileForm(false);
                    setIsReceiptModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <ReceiptScannerModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          accounts={accounts}
          activeAccountId={activeAccountId}
          onAddTransactionsBatch={onAddTransactionsBatch}
        />
      </div>
    );
  }

  // Desktop View — Carousel at top, Side-by-side grid below
  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in animate-duration-300">
      {/* Horizontal visual cards spanning full width */}
      <CardCarousel
        accounts={accounts}
        transactions={transactions}
        activeAccountId={activeAccountId}
        onSelectAccount={onSelectAccount}
      />

      {/* Dynamic Cash Flow Metrics Panel */}
      <CashFlowMetrics
        transactions={transactions}
        accounts={accounts}
        activeAccountId={activeAccountId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column: Form (span 4/12) */}
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <TransactionForm
            accounts={accounts}
            activeAccountId={activeAccountId}
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
          />
        </div>

        {/* Right Column: Reports & Lists (span 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Category Compliance Alerts */}
          {budgetWarnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {budgetWarnings.map((warning) => (
                <div
                  key={warning.category}
                  className="p-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-2xl flex items-center justify-between animate-fade-in text-left"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" /> Category limit exceeded: {warning.category}
                    </span>
                    <span className="text-[10px] text-text-secondary font-medium">
                      Monthly Spent: <strong>SAR {warning.spent.toLocaleString()}</strong> of allowed monthly limit: <strong>SAR {warning.limit.toLocaleString()}</strong>
                    </span>
                  </div>
                  <span className="text-xs bg-red-500 text-white font-extrabold px-3 py-1 rounded-lg shrink-0">
                    +SAR {warning.overAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Interactive SVG Category Chart */}
          <CategoryExpenseChart transactions={filteredTransactions} />

          {/* Active Savings Milestones */}
          {activeAccountId === null && (
            <SavingsGoals
              savingsGoals={savingsGoals}
              accounts={accounts}
              onContribute={onContribute}
              onAddGoal={onAddGoal}
              onDeleteGoal={onDeleteGoal}
            />
          )}

          {/* Daily spending and reports */}
          <WeeklyReport transactions={filteredTransactions} />

          {/* Dynamic Credit Card Payment Banner */}
          {activeAccountId && selectedCard?.type === "credit" && outstandingDebt > 0 && onOpenStatementModal && (
            <div className="glass-panel p-4 bg-action-blue/5 dark:bg-action-blue/10 border border-action-blue/15 rounded-2xl flex items-center justify-between animate-fade-in animate-duration-300">
              <div className="flex flex-col text-left gap-0.5">
                <span className="font-bold text-xs flex items-center gap-1.5 text-action-blue">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" /> Credit Statement Due
                </span>
                <span className="text-[10px] text-text-secondary font-medium">
                  Outstanding Balance: <strong>SAR {outstandingDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </span>
              </div>
              <button
                onClick={onOpenStatementModal}
                className="px-3.5 py-1.5 bg-accent-custom hover:opacity-90 text-accent-custom-fg font-medium rounded-full text-[10px] cursor-pointer transition shrink-0"
              >
                Pay Statement
              </button>
            </div>
          )}

          <TransactionList
            transactions={filteredTransactions}
            accounts={accounts}
            onDeleteTransaction={onDeleteTransaction}
          />
        </div>
      </div>

      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onAddTransactionsBatch={onAddTransactionsBatch}
      />
    </div>
  );
};

export default Home;
