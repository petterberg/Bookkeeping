"use client";

import Link from "next/link";
import { ArrowRight, AlertCircle, ReceiptText, Wallet } from "lucide-react";
import { cn, formatAmount, formatDate } from "@/lib/utils";
import type { Client } from "@/lib/types";

type Item = {
  href: string;
  tone: "red" | "amber";
  icon: typeof AlertCircle;
  title: string;
  body: string;
  cta: string;
};

export function MissingAlert({ client }: { client: Client }) {
  const items: Item[] = [];
  const today = new Date("2026-04-26");

  const missing = client.transactions.filter((t) => t.status === "saknar_underlag");
  if (missing.length > 0) {
    const total = missing.reduce((a, t) => a + Math.abs(t.amount), 0);
    items.push({
      href: "/klient/ladda-upp",
      tone: "red",
      icon: AlertCircle,
      title: `${missing.length} ${missing.length === 1 ? "transaktion saknar" : "transaktioner saknar"} underlag`,
      body: `Totalt ${formatAmount(total)} – Anna behöver underlagen för att stänga månaden.`,
      cta: "Ladda upp",
    });
  }

  const overdueInvoices = client.invoices.filter((i) => {
    if (i.status !== "skickad" && i.status !== "forfallen") return false;
    return new Date(i.dueDate).getTime() < today.getTime();
  });
  if (overdueInvoices.length > 0) {
    const total = overdueInvoices.reduce((a, i) => a + i.total, 0);
    const oldest = overdueInvoices.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];
    items.push({
      href: "/klient/faktura",
      tone: "amber",
      icon: ReceiptText,
      title: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? "faktura" : "fakturor"} förfallen`,
      body: `${formatAmount(total)} utestående · äldsta förföll ${formatDate(oldest.dueDate)}`,
      cta: "Visa fakturor",
    });
  }

  const pendingSalary = client.salaryRequests.find((s) => s.status === "begart");
  if (pendingSalary) {
    items.push({
      href: "/klient/lon",
      tone: "amber",
      icon: Wallet,
      title: "Löneuttag väntar på godkännande",
      body: `${formatAmount(pendingSalary.grossAmount)} brutto för ${pendingSalary.month} – Anna granskar.`,
      cta: "Se status",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {items.map((it, idx) => {
        const Icon = it.icon;
        const tone =
          it.tone === "red"
            ? "bg-red-soft border-red/15 text-red"
            : "bg-amber-soft border-amber/15 text-amber";
        return (
          <Link
            key={idx}
            href={it.href}
            className={cn("block rounded-xl border p-4 transition-colors hover:opacity-95 focus-ring", tone)}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper/60 shrink-0 mt-0.5">
                <Icon className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium leading-snug">{it.title}</p>
                <p className="text-[12.5px] opacity-90 mt-0.5">{it.body}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[12.5px] mt-1 shrink-0">
                {it.cta}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
