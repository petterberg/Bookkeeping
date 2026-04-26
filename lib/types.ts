export type Role = "klient" | "revisor";

export type ReceiptType = "privat" | "foretagskort" | "ovrigt";

export type TxStatus = "saknar_underlag" | "inkommen" | "bokford" | "ok";

export interface Transaction {
  id: string;
  date: string; // 'YYYY-MM-DD'
  description: string;
  amount: number; // negative = utgift
  status: TxStatus;
  receiptUrl?: string;
  receiptType?: ReceiptType;
  note?: string;
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
}

export interface Revisor {
  id: string;
  name: string;
  firm: string;
  email: string;
  clients: Client[];
}
