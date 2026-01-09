export interface Transaction {
  id: string;
  date: string; // ISO string
  shopName: string;
  bulbType: string; // e.g., '9W', '12W'
  quantity: number;
  costPrice: number; // Buying price
  sellPrice: number; // Selling price to shop
  type: 'SALE' | 'REPLACEMENT';
  notes?: string;
}

export interface SalesSummary {
  totalRevenue: number;
  totalProfit: number;
  totalReplacements: number;
  replacementCost: number;
  netProfit: number;
  totalSoldUnits: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS'
}