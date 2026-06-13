import React, { useState } from "react";
import { Settings as SettingsIcon, Folder, FileSpreadsheet, AlertTriangle, Trash2, Plus, CreditCard, Sliders } from "lucide-react";
import { getLocalSavingsGoals } from "../services/onedrive";
import type { Transaction, Account } from "../services/onedrive";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SettingsProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddAccount: (acc: { name: string; type: "credit" | "debit" | "cash"; color: string; lastFour: string; limit?: number; expiry?: string }) => void;
  onDeleteAccount: (id: string) => void;
  onClearTransactions: () => void;
  onReloadApp: () => void;
  categoryBudgets: { [key: string]: number };
  onUpdateCategoryBudgets: (limits: { [key: string]: number }) => void;
  onImportTransactions: (imported: Transaction[]) => void;
}

const GRADIENTS = [
  { name: "Deep Navy", class: "from-blue-600 to-indigo-700 bg-linear-to-r" },
  { name: "Green Emerald", class: "from-emerald-500 to-teal-600 bg-linear-to-r" },
  { name: "Crimson Red", class: "from-rose-500 to-red-600 bg-linear-to-r" },
  { name: "Purple Sunset", class: "from-purple-600 to-pink-700 bg-linear-to-r" },
  { name: "Golden Sand", class: "from-amber-400 to-orange-500 bg-linear-to-r" },
];

export const Settings: React.FC<SettingsProps> = ({
  transactions,
  accounts,
  onAddAccount,
  onDeleteAccount,
  onClearTransactions,
  onReloadApp,
  categoryBudgets,
  onUpdateCategoryBudgets,
  onImportTransactions,
}) => {
  // Card Manager Form State
  const [cardName, setCardName] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit" | "cash">("debit");
  const [cardColor, setCardColor] = useState("from-blue-600 to-indigo-700");
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardLimit, setCardLimit] = useState("10000");
  const [cardExpiry, setCardExpiry] = useState("");

  // Bank Statement CSV Importer State
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || "main_wallet");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    totalCount: number;
    dateRange: string;
    totalIncome: number;
    totalExpense: number;
    validTransactions: Transaction[];
  } | null>(null);

  // Simple state machine CSV parser
  const parseCSV = (text: string) => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentField = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        row.push(currentField.trim());
        currentField = "";
        if (row.length > 0 && row.some(field => field !== "")) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
      } else {
        currentField += char;
      }
    }
    if (currentField || row.length > 0) {
      row.push(currentField.trim());
      if (row.some(field => field !== "")) {
        lines.push(row);
      }
    }
    return lines;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length <= 1) {
          throw new Error("CSV file must contain a header row and at least one data row.");
        }

        // Detect column indices
        let headerRowIndex = 0;
        let dateIdx = -1;
        let noteIdx = -1;
        let amountIdx = -1;
        let categoryIdx = -1;
        let typeIdx = -1;

        for (let r = 0; r < Math.min(parsed.length, 5); r++) {
          const row = parsed[r];
          const d = row.findIndex(c => /date|time|val_date/i.test(c));
          const a = row.findIndex(c => /amount|value|sum|amt|sar/i.test(c));
          if (d !== -1 && a !== -1) {
            headerRowIndex = r;
            dateIdx = d;
            amountIdx = a;
            noteIdx = row.findIndex(c => /desc|note|detail|payee|particulars|info/i.test(c));
            categoryIdx = row.findIndex(c => /category|group|class/i.test(c));
            typeIdx = row.findIndex(c => /type|dr_cr|d_c/i.test(c));
            break;
          }
        }

        // Fallbacks if not auto-detected
        if (dateIdx === -1) dateIdx = 0;
        if (amountIdx === -1) amountIdx = 1;
        if (noteIdx === -1) noteIdx = 2 !== amountIdx && 2 !== dateIdx ? 2 : 3;

        const validTransactions: Transaction[] = [];
        let totalIncome = 0;
        let totalExpense = 0;
        let minDateStr = "";
        let maxDateStr = "";

        for (let i = headerRowIndex + 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (!row[dateIdx] || !row[amountIdx]) continue;

          // Parse Date
          const rawDate = row[dateIdx].trim();
          const parsedDate = new Date(rawDate);
          if (isNaN(parsedDate.getTime())) continue; // Skip invalid dates

          // Format date as YYYY-MM-DD
          const dateStr = parsedDate.toISOString().split("T")[0];

          // Track min/max dates
          if (!minDateStr || dateStr < minDateStr) minDateStr = dateStr;
          if (!maxDateStr || dateStr > maxDateStr) maxDateStr = dateStr;

          // Parse Amount
          const rawAmount = row[amountIdx].replace(/[^\d.-]/g, "");
          const val = parseFloat(rawAmount);
          if (isNaN(val)) continue;

          // Parse Note
          const noteStr = noteIdx !== -1 && row[noteIdx] ? row[noteIdx].trim() : "Imported Transaction";

          // Parse Category
          const catStr = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : "Others";

          // Determine Type and correct positive amount
          let type: "income" | "expense" = "expense";
          let amount = Math.abs(val);

          if (typeIdx !== -1 && row[typeIdx]) {
            const tVal = row[typeIdx].toLowerCase().trim();
            if (tVal.includes("inc") || tVal.includes("cr") || tVal.includes("credit") || tVal.includes("deposit")) {
              type = "income";
            } else if (tVal.includes("exp") || tVal.includes("dr") || tVal.includes("debit") || tVal.includes("charge")) {
              type = "expense";
            } else {
              type = val >= 0 ? "income" : "expense";
            }
          } else {
            type = val >= 0 ? "income" : "expense";
          }

          if (type === "income") {
            totalIncome += amount;
          } else {
            totalExpense += amount;
          }

          validTransactions.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            amount,
            category: catStr,
            type,
            date: dateStr,
            note: noteStr,
            accountId: targetAccountId,
            updatedAt: Date.now(),
          });
        }

        if (validTransactions.length === 0) {
          throw new Error("No valid transactions could be parsed from the CSV file.");
        }

        setPreviewData({
          totalCount: validTransactions.length,
          dateRange: minDateStr === maxDateStr ? minDateStr : `${minDateStr} to ${maxDateStr}`,
          totalIncome,
          totalExpense,
          validTransactions,
        });
      } catch (err: any) {
        alert(`Failed to parse CSV: ${err.message || err}`);
        setSelectedFile(null);
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (!previewData) return;
    if (confirm(`Import ${previewData.totalCount} transactions into Hisaab?`)) {
      onImportTransactions(previewData.validTransactions);
      alert("Transactions imported successfully!");
      setSelectedFile(null);
      setPreviewData(null);
    }
  };

  const handleCancelImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;

    const lastFourDigits = cardLastFour.trim().replace(/\D/g, "").slice(0, 4) || "0000";

    onAddAccount({
      name: cardName.trim(),
      type: cardType,
      color: cardColor,
      lastFour: lastFourDigits.padStart(4, "0"),
      limit: cardType === "credit" ? (parseFloat(cardLimit) || 10000) : undefined,
      expiry: cardType === "credit" ? cardExpiry.trim() : undefined,
    });

    setCardName("");
    setCardLastFour("");
    setCardLimit("10000");
    setCardExpiry("");
  };

  const exportToCSV = () => {
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
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hisaab_records_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBackup = () => {
    const backupData = {
      transactions: transactions,
      accounts: accounts,
      savingsGoals: getLocalSavingsGoals(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hisaab_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data || typeof data !== "object") {
          throw new Error("Invalid backup format: Must be a JSON object.");
        }
        
        const importedTx = Array.isArray(data.transactions) ? data.transactions : [];
        const importedAcc = Array.isArray(data.accounts) ? data.accounts : [];
        const importedGoals = Array.isArray(data.savingsGoals) ? data.savingsGoals : [];

        if (importedTx.length === 0 && importedAcc.length === 0 && importedGoals.length === 0) {
          throw new Error("Backup file is empty or missing data fields.");
        }

        if (confirm(`Are you sure you want to restore this backup? It contains:\n- ${importedTx.length} Transactions\n- ${importedAcc.length} Accounts\n- ${importedGoals.length} Savings Goals\n\nThis will completely overwrite your current local database!`)) {
          localStorage.setItem("budget_app_transactions", JSON.stringify(importedTx));
          localStorage.setItem("budget_app_accounts", JSON.stringify(importedAcc));
          localStorage.setItem("budget_app_savings_goals", JSON.stringify(importedGoals));
          alert("Database backup restored successfully! Reloading page...");
          onReloadApp();
        }
      } catch (err: any) {
        alert(`Failed to restore backup: ${err.message || err}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in animate-duration-300">
      {/* Title */}
      <div className="flex flex-col gap-1 border-b border-border-custom pb-4">
        <div className="flex items-center gap-2 text-accent-custom">
          <SettingsIcon className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Control Center</span>
        </div>
        <h2 className="text-2xl font-black text-text-primary tracking-tight">
          Application Settings
        </h2>
        <p className="text-xs text-text-secondary font-medium">
          Manage database backups, manage multiple payment cards, or connect a local folder on your desktop to automatically sync your database and transaction spreadsheets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* Local Folder Sync Guide */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
              <Folder className="w-4 h-4 text-accent-custom" />
              Local Folder Sync Guide
            </h3>
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-text-secondary font-medium">
              <p>
                Connect a local folder on your computer (like a folder on your Desktop) to automatically synchronize your transactions.
              </p>
              <ul className="list-disc pl-4 flex flex-col gap-1.5">
                <li>Creates a live <code className="bg-border-custom/30 px-1 py-0.5 rounded-sm">database.json</code> backup.</li>
                <li>Generates an Excel-compatible <code className="bg-border-custom/30 px-1 py-0.5 rounded-sm">transactions.csv</code> spreadsheet.</li>
                <li>Your data stays private and fully on your own local drive.</li>
              </ul>
              <div className="p-3 bg-accent-custom-bg/10 border border-accent-custom/20 rounded-xl mt-1 text-accent-custom">
                <strong>Tip:</strong> You can open the <code className="bg-border-custom/30 px-1.5 py-0.5 rounded-sm font-bold">transactions.csv</code> file directly in Microsoft Excel or Google Sheets to run custom pivots or format your reports!
              </div>
            </div>
          </div>

          {/* Card & Account Manager */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              Cards & Accounts Manager
            </h3>

            {/* Add Card Form */}
            <form onSubmit={handleAddCardSubmit} className="flex flex-col gap-3 text-xs font-semibold text-text-secondary">
              <div className="grid grid-cols-2 gap-3">
                {/* Card Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary font-bold">Card/Account Name</label>
                  <Input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. SNB Debit Card"
                    className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2"
                    required
                  />
                </div>

                {/* Last Four Digits */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary font-bold">Last 4 Digits</label>
                  <Input
                    type="text"
                    maxLength={4}
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ""))}
                    placeholder="4560"
                    className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Card Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary font-bold">Account Type</label>
                  <Select
                    value={cardType}
                    onValueChange={(val) => setCardType(val as any)}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-bold text-text-primary focus:outline-hidden cursor-pointer">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit Card</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Card Color Gradient */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary font-bold">Card Gradient Design</label>
                  <Select
                    value={cardColor}
                    onValueChange={setCardColor}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-bold text-text-primary focus:outline-hidden cursor-pointer">
                      <SelectValue placeholder="Select gradient" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADIENTS.map((grad) => (
                        <SelectItem key={grad.class} value={grad.class} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-3 rounded-xs ${grad.class} border border-white/10`} />
                            <span>{grad.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional Credit Limit & Expiry Input */}
              {cardType === "credit" && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="flex flex-col gap-1">
                    <label className="text-text-secondary font-bold">Credit Limit (SAR)</label>
                    <Input
                      type="number"
                      min="1"
                      value={cardLimit}
                      onChange={(e) => setCardLimit(e.target.value)}
                      placeholder="10000"
                      className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-text-secondary font-bold">Expiry Date (MM/YY)</label>
                    <Input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2) {
                          val = val.slice(0, 2) + "/" + val.slice(2, 4);
                        }
                        setCardExpiry(val);
                      }}
                      placeholder="06/28"
                      className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-lg font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-action-blue/50 focus:border-action-blue transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 mt-1.5 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-full font-medium cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Payment Card
              </Button>
            </form>

            {/* List of current cards */}
            <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border-custom/50">
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                Current Registered Cards
              </span>
              <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2.5 border border-border-custom/50 rounded-xl bg-border-custom/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-5 rounded ${acc.color} bg-linear-to-r border border-white/10`} />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-text-primary">{acc.name}</span>
                        <span className="text-[9px] text-text-secondary capitalize font-semibold flex items-center gap-1.5 flex-wrap">
                          {acc.type} account (•••• {acc.lastFour})
                          {acc.type === "credit" && (
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {acc.limit !== undefined && (
                                <span className="px-1.5 py-0.5 rounded bg-action-blue/10 text-action-blue font-medium border border-action-blue/15">
                                  Limit: SAR {acc.limit.toLocaleString()}
                                </span>
                              )}
                              {acc.expiry && (
                                <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary font-medium border border-border-custom">
                                  Exp: {acc.expiry}
                                </span>
                              )}
                            </div>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Prohibit deleting the default core cash wallet */}
                    {acc.id !== "main_wallet" ? (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Delete ${acc.name}? All transactions belonging to this card will be re-assigned to your Main Wallet.`
                            )
                          ) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        className="p-1.5 text-text-tertiary hover:text-expense-custom hover:bg-expense-custom-bg/20 rounded-lg transition"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[9px] text-success-custom font-black uppercase tracking-wide px-2 py-0.5 rounded bg-success-custom-bg">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database Actions & Guide */}
        <div className="flex flex-col gap-6">
          {/* Backups & Actions */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Backup & Database Controls
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              {/* CSV Export */}
              <div className="flex items-center justify-between p-3 border border-border-custom/50 rounded-2xl hover:bg-border-custom/5 transition">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-text-primary">Export Spreadsheet</span>
                  <span className="text-[10px] text-text-secondary font-medium">Download current database records in CSV.</span>
                </div>
                <Button
                  onClick={exportToCSV}
                  className="px-4 py-2 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  Export CSV
                </Button>
              </div>

              {/* JSON Backup Export */}
              <div className="flex items-center justify-between p-3 border border-border-custom/50 rounded-2xl hover:bg-border-custom/5 transition">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-text-primary">Export JSON Backup</span>
                  <span className="text-[10px] text-text-secondary font-medium">Download complete database backup (JSON) for your Desktop.</span>
                </div>
                <Button
                  onClick={handleExportBackup}
                  className="px-4 py-2 h-9 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  Export JSON
                </Button>
              </div>

              {/* JSON Backup Restore */}
              <div className="flex items-center justify-between p-3 border border-border-custom/50 rounded-2xl hover:bg-border-custom/5 transition">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-text-primary">Restore JSON Backup</span>
                  <span className="text-[10px] text-text-secondary font-medium">Restore all transactions, cards, and milestones from a file.</span>
                </div>
                <label className="px-4 py-2 h-9 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-xl font-bold cursor-pointer transition flex items-center justify-center text-center shadow-xs">
                  Restore JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset database */}
              <div className="flex items-center justify-between p-3 border border-border-custom/50 rounded-2xl hover:bg-border-custom/5 transition">
                <div className="flex flex-col">
                  <span className="font-bold text-expense-custom flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Wipe Database
                  </span>
                  <span className="text-[10px] text-text-secondary font-medium">Irreversibly delete all local transactions.</span>
                </div>
                <Button
                  onClick={() => {
                    if (confirm("WARNING: Are you sure you want to permanently delete all local transaction logs? This cannot be undone!")) {
                      onClearTransactions();
                      alert("Database wiped successfully.");
                    }
                  }}
                  className="px-4 py-2 h-9 bg-expense-custom hover:bg-red-600 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  Wipe Data
                </Button>
              </div>
            </div>
          </div>

          {/* Category Budget Limits */}
          <div className="glass-panel p-5 flex flex-col gap-4 animate-fade-in">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
              <Sliders className="w-4 h-4 text-accent-custom" />
              Monthly Budget Limits
            </h3>

            <div className="flex flex-col gap-4 text-xs font-semibold text-text-secondary">
              {Object.keys(categoryBudgets).map((catName) => (
                <div key={catName} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-text-primary font-bold">{catName} Limit (SAR)</label>
                    <span className="text-[10px] font-bold text-accent-custom bg-accent-custom-bg px-2 py-0.5 rounded-md">
                      SAR {categoryBudgets[catName].toLocaleString()}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={categoryBudgets[catName]}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      onUpdateCategoryBudgets({
                        ...categoryBudgets,
                        [catName]: val,
                      });
                    }}
                    className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50 transition-all duration-300"
                  />
                </div>
              ))}
              <p className="text-[10px] text-text-tertiary leading-relaxed mt-1">
                Warnings will flag automatically in the dashboard when your spending in any category exceeds these values.
              </p>
            </div>
          </div>

          {/* Bank Statement CSV Importer */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Bank Statement CSV Importer
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Upload your bank or credit card statement in <code className="bg-border-custom/30 px-1 py-0.5 rounded-sm font-bold">.csv</code> format to automatically import transactions.
            </p>

            <div className="flex flex-col gap-4 text-xs font-semibold text-text-secondary mt-1">
              {/* Select Target Card/Account */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-primary font-bold">Target Payment Card / Wallet</label>
                <Select
                  value={targetAccountId}
                  onValueChange={setTargetAccountId}
                >
                  <SelectTrigger className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-bold text-text-primary focus:outline-hidden cursor-pointer">
                    <SelectValue placeholder="Select target account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id} className="cursor-pointer">
                        {acc.name} (•••• {acc.lastFour})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CSV File Input */}
              <div className="flex flex-col gap-2">
                <label className="text-text-primary font-bold">Select CSV File</label>
                <div className="relative border-2 border-dashed border-border-custom/60 rounded-2xl p-6 hover:bg-border-custom/5 hover:border-accent-custom/50 transition duration-200 text-center flex flex-col items-center gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet className="w-8 h-8 text-text-tertiary" />
                  <span className="text-xs text-text-secondary font-bold">
                    {selectedFile ? selectedFile.name : "Drag & drop or click to upload CSV"}
                  </span>
                  {selectedFile && (
                    <span className="text-[10px] text-text-tertiary">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>

              {/* Parsing result summary overlay */}
              {previewData && (
                <div className="flex flex-col gap-3 p-4 border border-border-custom bg-border-custom/5 rounded-2xl animate-fade-in">
                  <span className="text-[11px] text-text-primary font-bold uppercase tracking-wider">
                    Statement Parse Summary
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary font-medium">
                    <div>Transactions found:</div>
                    <div className="font-bold text-text-primary">{previewData.totalCount}</div>
                    <div>Date range:</div>
                    <div className="font-bold text-text-primary">{previewData.dateRange}</div>
                    <div>Total Income:</div>
                    <div className="font-bold text-success-custom">SAR {previewData.totalIncome.toFixed(2)}</div>
                    <div>Total Expenses:</div>
                    <div className="font-bold text-expense-custom">SAR {previewData.totalExpense.toFixed(2)}</div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={handleCancelImport}
                      variant="outline"
                      className="flex-1 h-9 border border-border-custom hover:bg-border-custom/20 rounded-xl font-bold cursor-pointer transition text-center"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmImport}
                      className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold cursor-pointer transition text-center"
                    >
                      Confirm Import
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
