import React, { useState } from "react";
import { Trash2, Search, Inbox, FileSpreadsheet, FileJson } from "lucide-react";
import type { Transaction, Account } from "../services/onedrive";
import { CATEGORIES } from "./TransactionForm";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const groupTransactionsByDate = (txs: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    txs.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  };

  const grouped = groupTransactionsByDate(paginatedTransactions);

  const getDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    // Parse as local midnight (append T00:00:00 to avoid UTC-vs-local timezone offset mismatch)
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryIcon = (catName: string) => {
    const cat = CATEGORIES.find((c) => c.name === catName);
    return cat ? cat.icon : "•••";
  };

  const fmtCurrency = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transaction records to export.");
      return;
    }

    const headers = ["ID", "Type", "Amount", "Category", "Date", "Note", "Account ID", "Last Updated"];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.category,
      t.date,
      t.note.replace(/"/g, '""'),
      t.accountId,
      new Date(t.updatedAt).toISOString(),
    ]);

    const csvContent =
      "\uFEFF" + // BOM for Excel UTF-8 compatibility
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hisaab_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (transactions.length === 0) {
      alert("No transaction records to export.");
      return;
    }

    const jsonStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hisaab_transactions_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Transactions</h2>

        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <div className="flex items-center gap-1 border-r border-border-custom pr-2 mr-1">
            <button
              onClick={handleExportCSV}
              className="p-1.5 text-text-tertiary hover:text-accent-custom hover:bg-accent-custom-bg rounded-lg cursor-pointer transition-colors"
              title="Export to CSV (Excel)"
              aria-label="Export CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportJSON}
              className="p-1.5 text-text-tertiary hover:text-accent-custom hover:bg-accent-custom-bg rounded-lg cursor-pointer transition-colors"
              title="Export to JSON"
              aria-label="Export JSON"
            >
              <FileJson className="w-4 h-4" />
            </button>
          </div>

          {/* Type pills */}
          <div className="flex p-0.5 bg-bg-elevated rounded-lg">
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-200 cursor-pointer ${
                  filterType === t
                    ? "bg-bg-card text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-36 pl-8 pr-3 py-1.5 bg-bg-elevated rounded-lg text-xs font-medium text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-accent-custom/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Inbox className="w-8 h-8 text-text-tertiary" />
          <p className="text-sm font-medium text-text-secondary">No transactions found</p>
          <p className="text-xs text-text-tertiary">Add your first transaction to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.keys(grouped).map((date) => (
            <div key={date} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-tertiary px-1 mb-1">
                {getDateLabel(date)}
              </span>

              {grouped[date].map((t) => {
                const acc = accounts.find((a) => a.id === t.accountId);
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-elevated transition-colors duration-200 group"
                  >
                    {/* Category icon */}
                    <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center text-base shrink-0">
                      {getCategoryIcon(t.category)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {t.note}
                        </span>
                        {acc && (
                          <span className="text-[9px] font-semibold text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded shrink-0">
                            {acc.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-tertiary">{t.category}</span>
                    </div>

                    {/* Amount */}
                    <span
                      className={`text-sm font-semibold tabular-nums shrink-0 ${
                        t.type === "income" ? "text-success-custom" : "text-expense-custom"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}SAR {fmtCurrency(t.amount)}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm("Delete this transaction?")) onDeleteTransaction(t.id);
                      }}
                      className="p-1.5 text-text-tertiary hover:text-expense-custom rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-border-custom text-xs text-text-tertiary">
              <span>
                {currentPage} / {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  className="px-3 py-1 rounded-lg bg-bg-elevated font-medium disabled:opacity-40 cursor-pointer transition-colors hover:bg-border-custom/30"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                  className="px-3 py-1 rounded-lg bg-bg-elevated font-medium disabled:opacity-40 cursor-pointer transition-colors hover:bg-border-custom/30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
