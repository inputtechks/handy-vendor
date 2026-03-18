import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "helvelitt-offline";
const STORE_NAME = "pending-sales";
const DB_VERSION = 1;

interface PendingSale {
  id?: number;
  vendor_id: string;
  isbn: string;
  title: string;
  price: number;
  method: string;
  discount: number;
  transaction_type: string;
  note: string;
  sold_at: string;
  quantity: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineSale(sale: Omit<PendingSale, "id">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(sale);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSales(): Promise<PendingSale[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function clearPendingSales(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncOfflineSales(): Promise<number> {
  const pending = await getPendingSales();
  if (pending.length === 0) return 0;

  const rows = pending.map(({ id: _id, ...rest }) => ({ ...rest, quantity: rest.quantity ?? 1 }));

  const { error } = await supabase.from("sales").insert(rows as any);
  if (error) {
    console.error("Failed to sync offline sales:", error);
    return 0;
  }

  await clearPendingSales();
  return rows.length;
}

// Auto-sync when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    try {
      const count = await syncOfflineSales();
      if (count > 0) {
        console.log(`Synced ${count} offline sale(s)`);
      }
    } catch (e) {
      console.error("Auto-sync failed:", e);
    }
  });
}
