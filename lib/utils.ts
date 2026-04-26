import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReceiptType, TxStatus } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign && amount > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${sign}${formatted} kr`;
}

const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRelative(iso: string, now: Date = new Date("2026-03-24T12:00:00")): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  if (sameDay) return `idag ${time}`;
  if (isYesterday) return `igår ${time}`;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export const txStatusLabel: Record<TxStatus, string> = {
  saknar_underlag: "Saknar underlag",
  inkommen: "Inkommen",
  bokford: "Bokförd",
  ok: "Klar",
};

export const receiptTypeLabel: Record<ReceiptType, string> = {
  privat: "Privat utlägg",
  foretagskort: "Företagskort",
  ovrigt: "Övrigt",
};

export function uid(prefix: string = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
