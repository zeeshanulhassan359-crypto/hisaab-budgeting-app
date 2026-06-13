import { useState, useEffect } from "react";
import {
  getLocalTransactions,
  saveLocalTransactions,
  getLocalAccounts,
  saveLocalAccounts,
  DEFAULT_ACCOUNTS,
  syncOneDrive,
  getLocalSavingsGoals,
  saveLocalSavingsGoals,
} from "./services/onedrive";
import type { Transaction, Account, SavingsGoal } from "./services/onedrive";
import {
  loginWithMicrosoft,
  logoutMicrosoft,
  getActiveAccountInfo,
  getMsalInstance,
} from "./services/auth";
import { Header } from "./components/Header";
import { MobileLayout } from "./components/Layout/MobileLayout";
import { DesktopLayout } from "./components/Layout/DesktopLayout";
import { Home } from "./pages/Home";
import { Investments } from "./pages/Investments";
import { Settings } from "./pages/Settings";
import { StatementModal } from "./components/StatementModal";

function App() {
  // Navigation & Page State
  const [activePage, setActivePage] = useState<string>("home");

  // Multi-Card Accounts State
  const [accounts, setAccounts] = useState<Account[]>(() => getLocalAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null); // null is "All Accounts"

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalTransactions());

  // Savings Goals State
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => getLocalSavingsGoals());

  // Category Budgets Configuration State
  const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem("budget_limits");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn("Error parsing budget limits, using defaults", err);
      }
    }
    return {
      "Rent & Bills": 4000,
      "Food": 1500,
      "Entertainment": 1000,
    };
  });

  const handleUpdateCategoryBudgets = (newLimits: { [key: string]: number }) => {
    setCategoryBudgets(newLimits);
    localStorage.setItem("budget_limits", JSON.stringify(newLimits));
  };

  // Statement prompt modal state
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Screen Width/Responsive Layout State
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Global Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("hisaab-theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  // MSAL Active Account User State
  const [user, setUser] = useState<any>(null);

  // Sync Status Monitoring
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Local database mode (offline).");

  // Track responsive screen size updates
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Trigger statement prompt strictly on the 25th day of the month only
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();

    if (currentDay === 25) {
      const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const lastPrompted = localStorage.getItem("lastStatementPromptMonth");
      const lastSnoozed = localStorage.getItem("lastStatementSnoozeDate");
      const todayDateStr = today.toISOString().split("T")[0];

      // Find if there is any credit card with outstanding balance > 0
      const creditAccounts = accounts.filter((a) => a.type === "credit");
      let hasDebt = false;
      for (const acc of creditAccounts) {
        const relevantTx = transactions.filter((t) => t.accountId === acc.id);
        const income = relevantTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = relevantTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        if (expense - income > 0) {
          hasDebt = true;
          break;
        }
      }

      if (hasDebt && lastPrompted !== currentYearMonth && lastSnoozed !== todayDateStr) {
        setIsStatementModalOpen(true);
      }
    }
  }, [accounts, transactions]);

  // Update HTML elements class lists on theme change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Initial Bootstrapper: check active MSAL session, load local, and attempt auto-sync
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const instance = await getMsalInstance();
        const activeAcc = instance.getActiveAccount();
        if (activeAcc) {
          setUser(activeAcc);
          setSyncStatus("OneDrive account detected. Syncing...");
          triggerSync();
        } else {
          setUser(null);
          setSyncStatus("Unconnected. local database fallback.");
        }
      } catch (err) {
        console.warn("MSAL setup skipped or failed. Continuing in local-only mode.", err);
        setSyncStatus("Local database fallback.");
      }
    };
    bootstrapAuth();
  }, []);

  // Soft refresh callback for Settings configuration changes
  const handleReloadApp = async () => {
    try {
      const activeAcc = await getActiveAccountInfo();
      setUser(activeAcc);
      setTransactions(getLocalTransactions());
      setAccounts(getLocalAccounts());
      setSavingsGoals(getLocalSavingsGoals());
      if (activeAcc) {
        triggerSync();
      } else {
        setSyncStatus("Local database fallback.");
      }
    } catch {
      setUser(null);
      setSyncStatus("Local database fallback.");
    }
  };

  // Sync logic orchestrator
  const triggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Syncing OneDrive records...");
    try {
      const result = await syncOneDrive();
      setTransactions(result.transactions);
      setAccounts(result.accounts);
      setSavingsGoals(result.savingsGoals);
      setSyncStatus(result.statusMessage);
    } catch (err: any) {
      setSyncStatus(`Sync issue: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Theme Switcher
  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("hisaab-theme", next);
      return next;
    });
  };

  // Add Transaction handler
  const handleAddTransaction = async (txInput: {
    amount: number;
    category: string;
    type: "income" | "expense";
    date: string;
    note: string;
    accountId: string;
  }) => {
    const newTx: Transaction = {
      ...txInput,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      updatedAt: Date.now(),
    };

    const updatedList = [newTx, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setTransactions(updatedList);
    saveLocalTransactions(updatedList);

    if (user) {
      triggerSync();
    }
  };

  // Delete Transaction handler
  const handleDeleteTransaction = async (id: string) => {
    const updatedList = transactions.filter((t) => t.id !== id);
    setTransactions(updatedList);
    saveLocalTransactions(updatedList);

    if (user) {
      triggerSync();
    }
  };

  // Add Card/Account handler
  const handleAddAccount = (accInput: {
    name: string;
    type: "credit" | "debit" | "cash";
    color: string;
    lastFour: string;
    limit?: number;
    expiry?: string;
  }) => {
    const newAcc: Account = {
      ...accInput,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      updatedAt: Date.now(),
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    saveLocalAccounts(updated);

    if (user) {
      triggerSync();
    }
  };

  // Savings Goal Contribution Handler
  const handleContributeToGoal = async (goalId: string, amount: number, accountId: string) => {
    const updatedGoals = savingsGoals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          currentAmount: g.currentAmount + amount,
          updatedAt: Date.now(),
        };
      }
      return g;
    });

    setSavingsGoals(updatedGoals);
    saveLocalSavingsGoals(updatedGoals);

    // Record transfer expense on source account
    const sourceCard = accounts.find((a) => a.id === accountId);
    const sourceName = sourceCard ? sourceCard.name : "Wallet";
    const goal = savingsGoals.find((g) => g.id === goalId);
    const goalName = goal ? goal.name : "Savings Goal";

    const tx: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      amount,
      category: "Investments",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      note: `Goal Fund: ${goalName} (${sourceName})`,
      accountId,
      updatedAt: Date.now(),
    };

    const updatedTxList = [tx, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setTransactions(updatedTxList);
    saveLocalTransactions(updatedTxList);

    if (user) {
      triggerSync();
    }
  };

  // Delete Card/Account handler
  const handleDeleteAccount = (id: string) => {
    // Re-assign transactions belonging to deleted account to main_wallet
    const updatedTxList = transactions.map((t) =>
      t.accountId === id ? { ...t, accountId: "main_wallet", updatedAt: Date.now() } : t
    );

    setTransactions(updatedTxList);
    saveLocalTransactions(updatedTxList);

    const updatedAccList = accounts.filter((a) => a.id !== id);
    setAccounts(updatedAccList);
    saveLocalAccounts(updatedAccList);

    if (activeAccountId === id) {
      setActiveAccountId(null);
    }

    if (user) {
      triggerSync();
    }
  };

  // Wipe database reset triggers
  const handleClearTransactions = () => {
    setTransactions([]);
    saveLocalTransactions([]);
    setAccounts(DEFAULT_ACCOUNTS);
    saveLocalAccounts(DEFAULT_ACCOUNTS);
    setActiveAccountId(null);
    if (user) {
      triggerSync();
    }
  };

  // Login click actions
  const handleLogin = async () => {
    setSyncStatus("Connecting Microsoft OneDrive...");
    try {
      const activeAccount = await loginWithMicrosoft();
      if (activeAccount) {
        setUser(activeAccount);
        triggerSync();
      }
    } catch (err: any) {
      alert(`OneDrive Connection Failed: ${err.message || err}`);
      setSyncStatus("Connection failed.");
    }
  };

  // Logout actions
  const handleLogout = async () => {
    try {
      await logoutMicrosoft();
      setUser(null);
      setSyncStatus("OneDrive Signed Out. Local cache remains.");
    } catch (err: any) {
      console.error("Logout process encountered error", err);
    }
  };

  // Settle statement payment handlers
  const handleSettleStatementPayment = (creditAccountId: string, amount: number, sourceAccountId: string) => {
    const creditCard = accounts.find((a) => a.id === creditAccountId);
    const creditName = creditCard ? creditCard.name : "Credit Card";
    const sourceCard = accounts.find((a) => a.id === sourceAccountId);
    const sourceName = sourceCard ? sourceCard.name : "External Source";

    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();

    const incomeTx: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      amount,
      category: "Others",
      type: "income",
      date: today,
      note: sourceAccountId === "external"
        ? `Direct Statement Settle (External)`
        : `Statement Settle from ${sourceName}`,
      accountId: creditAccountId,
      updatedAt: now,
    };

    let updatedList = [incomeTx];

    if (sourceAccountId !== "external") {
      const expenseTx: Transaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        amount,
        category: "Rent & Bills",
        type: "expense",
        date: today,
        note: `Statement Settle for ${creditName}`,
        accountId: sourceAccountId,
        updatedAt: now,
      };
      updatedList.push(expenseTx);
    }

    const newTxList = [...updatedList, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setTransactions(newTxList);
    saveLocalTransactions(newTxList);

    // Prevent prompt for current month
    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    localStorage.setItem("lastStatementPromptMonth", currentYearMonth);
    setIsStatementModalOpen(false);
    
    if (user) {
      triggerSync();
    }
  };

  const handleDismissStatement = () => {
    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    localStorage.setItem("lastStatementPromptMonth", currentYearMonth);
    setIsStatementModalOpen(false);
  };

  const handleSnoozeStatement = () => {
    const todayDateStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("lastStatementSnoozeDate", todayDateStr);
    setIsStatementModalOpen(false);
  };

  // Render proper subpage inside layout viewport
  const renderPageContent = () => {
    switch (activePage) {
      case "home":
        return (
          <Home
            transactions={transactions}
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelectAccount={setActiveAccountId}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isMobile={isMobile}
            onOpenStatementModal={() => setIsStatementModalOpen(true)}
            savingsGoals={savingsGoals}
            onContribute={handleContributeToGoal}
            categoryBudgets={categoryBudgets}
          />
        );
      case "investments":
        return <Investments />;
      case "settings":
        return (
          <Settings
            transactions={transactions}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            onClearTransactions={handleClearTransactions}
            onReloadApp={handleReloadApp}
            categoryBudgets={categoryBudgets}
            onUpdateCategoryBudgets={handleUpdateCategoryBudgets}
          />
        );
      default:
        return (
          <Home
            transactions={transactions}
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelectAccount={setActiveAccountId}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isMobile={isMobile}
            onOpenStatementModal={() => setIsStatementModalOpen(true)}
            savingsGoals={savingsGoals}
            onContribute={handleContributeToGoal}
            categoryBudgets={categoryBudgets}
          />
        );
    }
  };

  // Bind proper shell wrappers (Mobile layout vs Desktop sidebar Layout)
  if (isMobile) {
    return (
      <>
        <MobileLayout activePage={activePage} setActivePage={setActivePage}>
          <Header
            transactions={transactions}
            accounts={accounts}
            activeAccountId={activeAccountId}
            theme={theme}
            toggleTheme={handleToggleTheme}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            syncStatus={syncStatus}
            isSyncing={isSyncing}
            onSync={triggerSync}
            activePage={activePage}
          />
          {renderPageContent()}
        </MobileLayout>
        <StatementModal
          isOpen={isStatementModalOpen}
          accounts={accounts}
          transactions={transactions}
          onSettlePayment={handleSettleStatementPayment}
          onDismiss={handleDismissStatement}
          onSnooze={handleSnoozeStatement}
        />
      </>
    );
  }

  return (
    <>
      <DesktopLayout activePage={activePage} setActivePage={setActivePage}>
        <Header
          transactions={transactions}
          accounts={accounts}
          activeAccountId={activeAccountId}
          theme={theme}
          toggleTheme={handleToggleTheme}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          onSync={triggerSync}
          activePage={activePage}
        />
        {renderPageContent()}
      </DesktopLayout>
      <StatementModal
        isOpen={isStatementModalOpen}
        accounts={accounts}
        transactions={transactions}
        onSettlePayment={handleSettleStatementPayment}
        onDismiss={handleDismissStatement}
        onSnooze={handleSnoozeStatement}
      />
    </>
  );
}

export default App;
