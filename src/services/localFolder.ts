import type { Transaction, Account, SavingsGoal } from "./onedrive";

const DB_NAME = "HisaabFolderDB";
const STORE_NAME = "handles";
const KEY = "folderHandle";

// Store directory handle in IndexedDB (handles are serializable in IDB)
export function saveHandleToIndexedDB(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(handle, KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Retrieve directory handle from IndexedDB
export function getHandleFromIndexedDB(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Clear directory handle from IndexedDB
export function clearHandleFromIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(KEY);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Verify directory handle permissions (browser security requires prompt on page reload)
export async function verifyPermission(fileHandle: FileSystemDirectoryHandle, readWrite: boolean): Promise<boolean> {
  const options: any = {};
  if (readWrite) {
    options.mode = "readwrite";
  }
  if ((await (fileHandle as any).queryPermission(options)) === "granted") {
    return true;
  }
  if ((await (fileHandle as any).requestPermission(options)) === "granted") {
    return true;
  }
  return false;
}

// Convert transactions array to Excel-compatible CSV string
export function convertToCSV(transactions: Transaction[], accounts: Account[]): string {
  const headers = ["ID", "Type", "Amount (SAR)", "Category", "Date", "Note", "Account Name"];
  const rows = transactions.map((t) => {
    const acc = accounts.find((a) => a.id === t.accountId);
    const accountName = acc ? acc.name : "Unknown";
    return [
      t.id,
      t.type,
      t.amount,
      t.category,
      t.date,
      t.note.replace(/"/g, '""'),
      accountName,
    ];
  });
  // Prefixing with BOM (\uFEFF) forces Microsoft Excel to open CSV with UTF-8 encoding correctly
  return "\uFEFF" + [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\r\n");
}

// Write database state (JSON) and spreadsheets (CSV) directly to connected directory
export async function writeDataToFolder(
  directoryHandle: FileSystemDirectoryHandle,
  transactions: Transaction[],
  accounts: Account[],
  savingsGoals: SavingsGoal[]
): Promise<void> {
  // 1. Write database.json
  const dbFileHandle = await directoryHandle.getFileHandle("database.json", { create: true });
  const dbWritable = await dbFileHandle.createWritable();
  const dbContent = JSON.stringify({ transactions, accounts, savingsGoals }, null, 2);
  await dbWritable.write(dbContent);
  await dbWritable.close();

  // 2. Write transactions.csv for Excel
  const csvFileHandle = await directoryHandle.getFileHandle("transactions.csv", { create: true });
  const csvWritable = await csvFileHandle.createWritable();
  const csvContent = convertToCSV(transactions, accounts);
  await csvWritable.write(csvContent);
  await csvWritable.close();
}

// Read database.json from connected directory (returns null if doesn't exist)
export async function readDataFromFolder(directoryHandle: FileSystemDirectoryHandle): Promise<{
  transactions: Transaction[];
  accounts: Account[];
  savingsGoals: SavingsGoal[];
} | null> {
  try {
    const dbFileHandle = await directoryHandle.getFileHandle("database.json");
    const file = await dbFileHandle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    return {
      transactions: data.transactions || [],
      accounts: data.accounts || [],
      savingsGoals: data.savingsGoals || [],
    };
  } catch (err) {
    console.log("database.json not found in the selected folder, starting fresh.", err);
    return null;
  }
}
