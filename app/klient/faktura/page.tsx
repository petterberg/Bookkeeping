"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, ArrowRight } from "lucide-react";
import { useCurrentClient } from "@/lib/store";
import { InvoiceBadge } from "@/components/klient/InvoiceBadge";
import { cn, formatAmount, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";

type Filter = "alla" | "utkast" | "skickad" | "betald" | "forfallen";

export default function FakturaListPage() {
  const client = useCurrentClient();
  const [filter, setFilter] = useState<Filter>("alla");

  const invoices = useMemo(() => {
    const sorted = [...client.invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
    if (filter === "alla") return sorted;
    return sorted.filter((i) => i.status === filter);
  }, [client.invoices, filter]);

  const utestaende = client.invoices
    .filter((i) => i.status === "skickad" || i.status === "forfallen")
    .reduce((a, i) => a + i.total, 0);
  const betaldDennaManad = client.invoices
    .filter((i) => i.status === "betald" && i.paidAt && i.paidAt.startsWith("2026-03"))
    .reduce((a, i) => a + i.total, 0);

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "alla", label: "Alla", count: client.invoices.length },
    { value: "utkast", label: "Utkast", count: client.invoices.filter((i) => i.status === "utkast").length },
    { value: "skickad", label: "Skickade", count: client.invoices.filter((i) => i.status === "skickad").length },
    { value: "forfallen", label: "Förfallna", count: client.invoices.filter((i) => i.status === "forfallen").length },
    { value: "betald", label: "Betalda", count: client.invoices.filter((i) => i.status === "betald").length },
  ];

  return (
    <div className="px-5">
      <header className="pt-5 pb-3 flex items-center gap-3">
        <Link
          href="/klient"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border hairline bg-paper2 hover:bg-paper3 focus-ring"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Link>
        <div className="flex-1">
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink3">Fakturor</p>
          <h1 className="display text-[26px] leading-tight">Fakturera kund</h1>
        </div>
        <Link
          href="/klient/faktura/ny"
          className="inline-flex h-9 items-center gap-1.5 px-3 rounded-full bg-ink text-paper text-[13px] hover:bg-ink2"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Ny faktura
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-2.5 mt-2">
        <div className="rounded-xl border hairline bg-paper2 p-3.5">
          <p className="text-[11.5px] uppercase tracking-[0.14em] text-ink3">Utestående</p>
          <p className="display text-[22px] mono leading-none mt-1.5">{formatAmount(utestaende)}</p>
          <p className="text-[11.5px] text-ink3 mt-1.5">
            {client.invoices.filter((i) => i.status === "skickad" || i.status === "forfallen").length} fakturor
          </p>
        </div>
        <div className="rounded-xl border hairline bg-green-soft p-3.5 text-green">
          <p className="text-[11.5px] uppercase tracking-[0.14em] opacity-80">Betalda i mars</p>
          <p className="display text-[22px] mono leading-none mt-1.5">{formatAmount(betaldDennaManad)}</p>
          <p className="text-[11.5px] opacity-80 mt-1.5">
            {client.invoices.filter((i) => i.status === "betald" && i.paidAt?.startsWith("2026-03")).length} st
          </p>
        </div>
      </section>

      <div className="mt-4 -mx-5 px-5 overflow-x-auto scrollbar-thin">
        <div className="flex gap-2 pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-[12.5px] whitespace-nowrap transition-colors",
                filter === f.value
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper2 text-ink2 hairline hover:bg-paper3",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "mono text-[11px]",
                  filter === f.value ? "text-paper/70" : "text-ink3",
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <section className="mt-2">
        {invoices.length === 0 ? (
          <div className="rounded-xl border hairline bg-paper2 p-6 text-center">
            <p className="display text-[20px]">Inga fakturor här</p>
            <p className="text-[13px] text-ink3 mt-1">Inget matchar filtret.</p>
          </div>
        ) : (
          <div className="rounded-xl border hairline bg-paper2 overflow-hidden divide-y divide-line">
            {invoices.map((inv) => {
              const isOverdue = inv.status === "forfallen";
              return (
                <Link
                  key={inv.id}
                  href={`/klient/faktura?id=${inv.id}`}
                  className="block px-4 py-3.5 hover:bg-paper3 row-hover"
                  style={{ ["--row-pl" as never]: "1rem" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] truncate">{inv.customerName}</p>
                      <p className="text-[11.5px] text-ink3 truncate mono">
                        {inv.number} · utställd {formatDate(inv.issueDate)} · förfaller {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="mono text-[14.5px]">{formatAmount(inv.total)}</p>
                      <div className="mt-1">
                        <InvoiceBadge status={inv.status} />
                      </div>
                    </div>
                  </div>
                  {inv.note ? (
                    <p
                      className={cn(
                        "text-[11.5px] mt-1.5",
                        isOverdue ? "text-red" : "text-ink3",
                      )}
                    >
                      {inv.note}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-4 mb-2">
        <Link
          href="/klient/faktura/ny"
          className="block rounded-xl border hairline bg-ink text-paper p-4 hover:bg-ink2 focus-ring"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.14em] text-paper/60">Skapa</p>
              <p className="display text-[20px] mt-0.5">Ny faktura</p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper/15">
              <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
