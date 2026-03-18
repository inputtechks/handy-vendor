export interface Book {
  isbn: string;
  title: string;
  author: string;
  coverUrl: string;
  salePrice: number;
  quantity: number;
  category: string;
  royaltyPercentage: number;
}

export type TransactionType =
  | "retail"
  | "depot_deposit"
  | "depot_sold"
  | "depot_return"
  | "auteur"
  | "internet"
  | "pilon"
  | "sp";

export type PaymentMethod = "cash" | "card" | "twint" | "none";

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  retail: "Pulla të vogla",
  depot_deposit: "Dépôt – Deposited",
  depot_sold: "Dépôt – Sold",
  depot_return: "Dépôt – Returned",
  auteur: "Auteur",
  internet: "Internet",
  pilon: "Pilon",
  sp: "SP (Press)",
};

/** Transaction types that are zero-revenue stock adjustments */
export const ZERO_REVENUE_TYPES: TransactionType[] = ["pilon", "sp", "depot_deposit", "depot_return"];

/** Transaction types that generate revenue */
export const REVENUE_TYPES: TransactionType[] = ["retail", "depot_sold", "auteur", "internet"];

export interface Sale {
  id: string;
  isbn: string;
  title: string;
  price: number;
  method: PaymentMethod;
  discount: number;
  quantity: number;
  timestamp: number;
  transactionType: TransactionType;
  note: string;
}
