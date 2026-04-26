export type Role = "klient" | "revisor";

export type ReceiptType = "privat" | "foretagskort" | "ovrigt";

export type TxStatus = "saknar_underlag" | "inkommen" | "bokford" | "ok";

export interface BookkeepingPosting {
  account: string; // BAS-konto, t.ex. "5611"
  accountName: string; // "Drivmedel"
  vatRate: number; // 0, 6, 12, 25
  category?: string; // valfri etikett
}

export interface Transaction {
  id: string;
  date: string; // 'YYYY-MM-DD'
  description: string;
  amount: number; // negative = utgift
  status: TxStatus;
  receiptUrl?: string;
  receiptType?: ReceiptType;
  note?: string;
  posting?: BookkeepingPosting; // satt vid bokföring
  orphanId?: string; // länk till matchat underlag som följde med från importen
}

export interface OrphanReceipt {
  id: string;
  filename: string;
  ocrMotpart: string;
  ocrAmount: number; // positivt belopp på kvittot
  ocrDate: string; // YYYY-MM-DD
  receiptType: ReceiptType;
  note?: string;
  uploadedAt: string; // ISO
}

export interface LearnedRule {
  id: string;
  pattern: string; // motpart-substring (lowercase)
  posting: BookkeepingPosting;
  count: number; // hur många gånger den här mappingen bekräftats
  lastUsed: string; // ISO
}

export interface SuggestionSource {
  kind: "rule" | "history";
  label: string; // "Standardregel" / "Lärt från klient"
  count?: number; // antal historiska träffar
}

export interface BookkeepingSuggestion {
  posting: BookkeepingPosting;
  confidence: number; // 0–100
  source: SuggestionSource;
}

export interface Message {
  id: string;
  from: Role;
  text: string;
  timestamp: string; // ISO
  read: boolean;
}

export interface Client {
  id: string;
  name: string;
  orgNr: string;
  contactName: string;
  email: string;
  bank: string;
  missingCount: number;
  lastActive: string; // ISO date
  fortnoxSynced: boolean;
  transactions: Transaction[];
  messages: Message[];
  orphans: OrphanReceipt[];
  learnedRules: LearnedRule[];
  sampleCsv?: string; // demo: kontoutdrag som kan importeras
}

export interface Revisor {
  id: string;
  name: string;
  firm: string;
  email: string;
  clients: Client[];
}
