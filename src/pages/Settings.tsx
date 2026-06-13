import React, { useState } from "react";
import { Settings as SettingsIcon, Cloud, FileSpreadsheet, RotateCcw, AlertTriangle, Key, Trash2, Plus, CreditCard, Sliders } from "lucide-react";
import { getOAuthConfig, saveOAuthConfig, clearOAuthConfig } from "../services/auth";
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
}) => {
  const currentConfig = getOAuthConfig();
  const [clientId, setClientId] = useState(currentConfig.clientId);
  const [tenantId, setTenantId] = useState(currentConfig.tenantId);
  const [redirectUri, setRedirectUri] = useState(currentConfig.redirectUri);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Card Manager Form State
  const [cardName, setCardName] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit" | "cash">("debit");
  const [cardColor, setCardColor] = useState("from-blue-600 to-indigo-700");
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardLimit, setCardLimit] = useState("10000");
  const [cardExpiry, setCardExpiry] = useState("");

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveOAuthConfig({
      clientId: clientId.trim(),
      tenantId: tenantId.trim(),
      redirectUri: redirectUri.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onReloadApp();
    }, 1200);
  };

  const handleResetConfig = () => {
    if (confirm("Reset connection settings to default Hisaab sandbox credentials?")) {
      clearOAuthConfig();
      const reset = getOAuthConfig();
      setClientId(reset.clientId);
      setTenantId(reset.tenantId);
      setRedirectUri(reset.redirectUri);
      onReloadApp();
    }
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
          Manage database backups, manage multiple payment cards, or connect your custom OneDrive cloud credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* OneDrive App Registration Credentials */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-custom/50 pb-2">
              <Cloud className="w-4 h-4 text-accent-custom" />
              OneDrive Auth Config
            </h3>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-3.5 text-xs font-semibold text-text-secondary">
              {/* Client ID */}
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary font-bold">Azure Application (Client) ID</label>
                <Input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter Client ID"
                  className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50 transition"
                  required
                />
              </div>

              {/* Tenant ID */}
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary font-bold">Directory (Tenant) ID</label>
                <Input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="common, organizations, or tenant GUID"
                  className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50 transition"
                  required
                />
              </div>

              {/* Redirect URI */}
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary font-bold">Redirect URI</label>
                <Input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="http://localhost:5173"
                  className="w-full h-10 px-3.5 py-2.5 bg-border-custom/10 border border-border-custom rounded-xl font-medium text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent-custom/50 transition"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-custom/50">
                <Button
                  type="submit"
                  className="flex-1 h-10 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-xl font-bold cursor-pointer transition text-center shadow-xs"
                >
                  {saveSuccess ? "Saved & Restarting..." : "Save & Reconnect"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetConfig}
                  className="h-10 w-10 border border-border-custom hover:bg-border-custom/20 rounded-xl text-text-secondary cursor-pointer transition p-0 flex items-center justify-center"
                  title="Reset to Defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </form>
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
                <div className="flex flex-col">
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

          {/* Quick Integration Guide */}
          <div className="glass-panel p-5 flex flex-col gap-3 text-xs leading-relaxed text-text-secondary">
            <h4 className="font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom/50 pb-1.5">
              <Key className="w-4 h-4 text-amber-500" />
              Azure App Reg Guide
            </h4>
            <ol className="list-decimal pl-4 flex flex-col gap-1.5 font-medium">
              <li>Log in to the <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="text-accent-custom hover:underline font-bold">Azure Portal</a>.</li>
              <li>Go to <strong>Microsoft Entra ID (Azure Active Directory)</strong> &gt; <strong>App registrations</strong>.</li>
              <li>Select <strong>New registration</strong>. Set redirect type to <strong>SPA</strong> and input your hosting URI (e.g. <code className="bg-border-custom/30 px-1 py-0.5 rounded-sm">http://localhost:5173</code>).</li>
              <li>Add API Permission: <code className="bg-border-custom/30 px-1 py-0.5 rounded-sm">Files.ReadWrite.AppFolder</code> and grant admin consent if needed.</li>
              <li>Copy the <strong>Application (client) ID</strong> and paste it into the configs on the left!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
