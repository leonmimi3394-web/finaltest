
import { Transaction, SalesSummary } from '../types';
import { db, auth } from './firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';

const STORAGE_KEY = 'lumibiz_transactions_v1';
const COLLECTION_NAME = 'transactions';

// Helper to check if we are online and logged in
const isCloudEnabled = () => !!auth.currentUser && !!db;

export const getTransactions = async (): Promise<Transaction[]> => {
  if (isCloudEnabled() && auth.currentUser) {
    try {
      // Fetch from Firestore (Modular syntax)
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", auth.currentUser.uid),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
        
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
    } catch (error) {
      console.error("Firestore Get Error:", error);
      return [];
    }
  } else {
    // Local Storage Fallback
    const data = localStorage.getItem(STORAGE_KEY);
    return Promise.resolve(data ? JSON.parse(data) : []);
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  if (isCloudEnabled() && auth.currentUser) {
    try {
      const { id, ...data } = transaction; 
      
      // Add to Firestore (Modular syntax)
      await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Firestore Save Error:", error);
      throw error;
    }
  } else {
    // Local Storage
    const current = await getTransactions();
    const updated = [transaction, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (isCloudEnabled()) {
    try {
      // Delete from Firestore (Modular syntax)
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Firestore Delete Error:", error);
      throw error;
    }
  } else {
    // Local Storage
    const current = await getTransactions();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};

// Summary calculation remains synchronous as it operates on the already fetched array
export const calculateSummary = (transactions: Transaction[]): SalesSummary => {
  let totalRevenue = 0;
  let grossProfit = 0;
  let totalReplacements = 0;
  let replacementCost = 0;
  let totalSoldUnits = 0;

  transactions.forEach(t => {
    if (t.type === 'SALE') {
      const revenue = t.quantity * t.sellPrice;
      const cost = t.quantity * t.costPrice;
      totalRevenue += revenue;
      grossProfit += (revenue - cost);
      totalSoldUnits += t.quantity;
    } else if (t.type === 'REPLACEMENT') {
      const cost = t.quantity * t.costPrice;
      replacementCost += cost;
      totalReplacements += t.quantity;
    }
  });

  return {
    totalRevenue,
    totalProfit: grossProfit,
    totalReplacements,
    replacementCost,
    netProfit: grossProfit - replacementCost,
    totalSoldUnits
  };
};

export const getInventorySummary = (transactions: Transaction[]) => {
  const summary: Record<string, { sold: number, replaced: number }> = {};
  
  transactions.forEach(t => {
    if (!summary[t.bulbType]) {
      summary[t.bulbType] = { sold: 0, replaced: 0 };
    }
    if (t.type === 'SALE') {
      summary[t.bulbType].sold += t.quantity;
    } else {
      summary[t.bulbType].replaced += t.quantity;
    }
  });
  
  return Object.entries(summary).map(([name, data]) => ({
    name,
    ...data
  }));
};
