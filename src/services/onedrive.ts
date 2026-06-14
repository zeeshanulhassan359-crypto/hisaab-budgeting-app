import { getAccessToken } from "./auth";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
  note: string;
  accountId: string; // Foreign key linking to the selected account/card
  updatedAt: number; // timestamp in milliseconds
}

export interface Account {
  id: string;
  name: string;
  type: "credit" | "debit" | "cash";
  color: string; // Tailwind CSS gradient class name (e.g. "from-blue-500 to-indigo-600")
  lastFour: string; // digits
  limit?: number; // Credit limit (applicable to credit card accounts)
  expiry?: string; // Expiry date MM/YY (applicable to credit cards)
  updatedAt: number;
}

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

export interface SyncPayload {
  transactions: Transaction[];
  accounts: Account[];
  savingsGoals: SavingsGoal[];
}

const LOCAL_TX_KEY = "budget_app_transactions";
const LOCAL_ACC_KEY = "budget_app_accounts";
const LOCAL_GOALS_KEY = "budget_app_savings_goals";
const REMOTE_FILE_PATH = "/me/drive/special/approot:/transactions.json:/content";
const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

// Standard default accounts pre-populated on first launch
export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: "main_wallet",
    name: "Main Wallet",
    type: "cash",
    color: "from-emerald-500 to-teal-600",
    lastFour: "0000",
    updatedAt: 1718000000000,
  },
  {
    id: "snb_card",
    name: "SNB Mada Card",
    type: "debit",
    color: "from-blue-600 to-indigo-700",
    lastFour: "4560",
    updatedAt: 1718000000000,
  },
  {
    id: "al_rajhi_card",
    name: "Al Rajhi Credit Card",
    type: "credit",
    color: "from-purple-600 to-pink-700",
    lastFour: "8912",
    limit: 10000,
    expiry: "09/29",
    updatedAt: 1718000000000,
  },
];

// Retrieve local cache of transactions
export function getLocalTransactions(): Transaction[] {
  const localData = localStorage.getItem(LOCAL_TX_KEY);
  if (!localData) return [];
  try {
    const parsed = JSON.parse(localData);
    // Backward compatibility: ensure all transactions have accountId
    return parsed.map((t: any) => ({
      ...t,
      accountId: t.accountId || "main_wallet",
    }));
  } catch (err) {
    console.error("Failed parsing local transactions, returning empty array", err);
    return [];
  }
}

// Write transactions to local cache
export function saveLocalTransactions(transactions: Transaction[]) {
  localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(transactions));
}

// Retrieve local cache of accounts
export function getLocalAccounts(): Account[] {
  const localData = localStorage.getItem(LOCAL_ACC_KEY);
  if (!localData) {
    // Write defaults on first access
    saveLocalAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }
  try {
    return JSON.parse(localData);
  } catch (err) {
    console.error("Failed parsing local accounts, returning defaults", err);
    return DEFAULT_ACCOUNTS;
  }
}

// Write accounts to local cache
export function saveLocalAccounts(accounts: Account[]) {
  localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(accounts));
}

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  { id: "emergency_fund", name: "Emergency Fund", targetAmount: 15000, currentAmount: 5000, updatedAt: 1718000000000 },
  { id: "laptop", name: "New Laptop", targetAmount: 6000, currentAmount: 2500, updatedAt: 1718000000000 },
  { id: "japan_trip", name: "Japan Trip", targetAmount: 20000, currentAmount: 4000, updatedAt: 1718000000000 },
];

export function getLocalSavingsGoals(): SavingsGoal[] {
  const localData = localStorage.getItem(LOCAL_GOALS_KEY);
  if (!localData) {
    saveLocalSavingsGoals(DEFAULT_SAVINGS_GOALS);
    return DEFAULT_SAVINGS_GOALS;
  }
  try {
    return JSON.parse(localData);
  } catch (err) {
    console.error("Failed parsing local savings goals, returning defaults", err);
    return DEFAULT_SAVINGS_GOALS;
  }
}

export function saveLocalSavingsGoals(goals: SavingsGoal[]) {
  localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify(goals));
}

export function smartMergeSavingsGoals(local: SavingsGoal[], remote: SavingsGoal[]): SavingsGoal[] {
  const mergedMap = new Map<string, SavingsGoal>();
  local.forEach((g) => mergedMap.set(g.id, g));
  remote.forEach((rg) => {
    const lg = mergedMap.get(rg.id);
    if (!lg || rg.updatedAt > lg.updatedAt) {
      mergedMap.set(rg.id, rg);
    }
  });
  return Array.from(mergedMap.values());
}

// Perform smart merge between local and remote transaction arrays
export function smartMergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
  const mergedMap = new Map<string, Transaction>();

  local.forEach((t) => mergedMap.set(t.id, t));
  remote.forEach((rt) => {
    const lt = mergedMap.get(rt.id);
    if (!lt || rt.updatedAt > lt.updatedAt) {
      // Ensure imported remote items have valid accountId
      mergedMap.set(rt.id, {
        ...rt,
        accountId: rt.accountId || "main_wallet",
      });
    }
  });

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Perform smart merge between local and remote accounts
export function smartMergeAccounts(local: Account[], remote: Account[]): Account[] {
  const mergedMap = new Map<string, Account>();

  local.forEach((a) => mergedMap.set(a.id, a));
  remote.forEach((ra) => {
    const la = mergedMap.get(ra.id);
    if (!la || ra.updatedAt > la.updatedAt) {
      mergedMap.set(ra.id, ra);
    }
  });

  return Array.from(mergedMap.values());
}

// Fetch sync payload from Microsoft OneDrive AppRoot folder
export async function fetchFromOneDrive(): Promise<SyncPayload | null> {
  const token = await getAccessToken();
  if (!token) {
    console.log("No OneDrive access token available. Skipping fetch.");
    return null;
  }

  try {
    const response = await fetch(`${GRAPH_BASE_URL}${REMOTE_FILE_PATH}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      // File does not exist yet on remote, return empty payload
      return { transactions: [], accounts: DEFAULT_ACCOUNTS, savingsGoals: DEFAULT_SAVINGS_GOALS };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneDrive fetch error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Migrate old flat array format to the new object format
    if (Array.isArray(data)) {
      return {
        transactions: data.map((t: any) => ({
          ...t,
          accountId: t.accountId || "main_wallet",
        })),
        accounts: DEFAULT_ACCOUNTS,
        savingsGoals: DEFAULT_SAVINGS_GOALS,
      };
    }

    // Ensure valid object shape
    return {
      transactions: data.transactions || [],
      accounts: data.accounts || DEFAULT_ACCOUNTS,
      savingsGoals: data.savingsGoals || DEFAULT_SAVINGS_GOALS,
    };
  } catch (error) {
    console.error("Error fetching sync payload from OneDrive:", error);
    throw error;
  }
}

// Push sync payload to Microsoft OneDrive AppRoot folder
export async function pushToOneDrive(payload: SyncPayload): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    console.log("No OneDrive access token available. Skipping push.");
    return false;
  }

  try {
    const response = await fetch(`${GRAPH_BASE_URL}${REMOTE_FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneDrive upload error (${response.status}): ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error("Error uploading sync payload to OneDrive:", error);
    throw error;
  }
}

// Full sync orchestration: pull remote, smart merge, save local, and push back if needed
export async function syncOneDrive(): Promise<{
  success: boolean;
  transactions: Transaction[];
  accounts: Account[];
  savingsGoals: SavingsGoal[];
  statusMessage: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      transactions: getLocalTransactions(),
      accounts: getLocalAccounts(),
      savingsGoals: getLocalSavingsGoals(),
      statusMessage: "Unauthenticated. Using Local Storage.",
    };
  }

  try {
    const localTx = getLocalTransactions();
    const localAcc = getLocalAccounts();
    const localGoals = getLocalSavingsGoals();
    const remotePayload = await fetchFromOneDrive();

    if (remotePayload === null) {
      return {
        success: false,
        transactions: localTx,
        accounts: localAcc,
        savingsGoals: localGoals,
        statusMessage: "Sync failed: Token error.",
      };
    }

    // Smart merge local and remote
    const mergedTx = smartMergeTransactions(localTx, remotePayload.transactions);
    const mergedAcc = smartMergeAccounts(localAcc, remotePayload.accounts);
    const mergedGoals = smartMergeSavingsGoals(localGoals, remotePayload.savingsGoals || []);

    // Save back to local storage
    saveLocalTransactions(mergedTx);
    saveLocalAccounts(mergedAcc);
    saveLocalSavingsGoals(mergedGoals);

    // Push back consolidated updates to OneDrive
    const consolidatedPayload: SyncPayload = {
      transactions: mergedTx,
      accounts: mergedAcc,
      savingsGoals: mergedGoals,
    };
    await pushToOneDrive(consolidatedPayload);

    return {
      success: true,
      transactions: mergedTx,
      accounts: mergedAcc,
      savingsGoals: mergedGoals,
      statusMessage: `Synced successfully at ${new Date().toLocaleTimeString()}`,
    };
  } catch (error: any) {
    return {
      success: false,
      transactions: getLocalTransactions(),
      accounts: getLocalAccounts(),
      savingsGoals: getLocalSavingsGoals(),
      statusMessage: `Sync failed: ${error.message || error}`,
    };
  }
}
