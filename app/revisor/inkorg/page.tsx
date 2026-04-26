"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { useApp } from "@/lib/store";
import { Topbar } from "@/components/revisor/Sidebar";
import { InboxRow } from "@/components/revisor/InboxRow";
import type { Client, Transaction } from "@/lib/types";

export default function InkorgPage() {
  const { state } = useApp();

  const items: { tx: Transaction; client: Client }[] = state.revisor.clients.flatMap((c) =>
    c.transactions
      .filter((t) => t.status === "inkommen")
      .map((tx) => ({ tx, client: c })),
  );

  const totalAmount = items.reduce((a, x) => a + Math.abs(x.tx.amount), 0);
  const grouped = state.revisor.clients
    .map((c) => ({ client: c, items: items.filter((i) => i.client.id === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <Topbar
        subtitle="Inkorg"
        title={items.length > 0 ? `${items.length} underlag redo att bokföras` : "Inget i inkorgen"}
        meta={
          items.length > 0
            ? `${grouped.length} klienter · totalt ${new Intl.NumberFormat("sv-SE").format(Math.round(totalAmount))} kr`
            : "Du är ifatt. Snyggt jobbat."
        }
      />

      <div className="px-8 lg:px-10 py-6">
        {items.length === 0 ? (
          <div className="rounded-xl border hairline bg-paper2 p-10 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper border hairline mb-3">
              <Inbox className="h-5 w-5 text-ink3" strokeWidth={1.5} />
            </span>
            <p className="display text-[24px]">Inkorgen är tom</p>
            <p className="text-[13px] text-ink3 mt-1 max-w-[36ch] mx-auto">
              När klienter laddar upp underlag dyker de upp här, redo att bokföras.
            </p>
            <Link
              href="/revisor"
              className="inline-flex items-center gap-1.5 mt-4 text-[13px] text-ink hover:underline"
            >
              Tillbaka till översikt
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <section key={g.client.id} className="rounded-xl border hairline bg-paper overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between border-b hairline bg-paper2/40">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper border hairline text-[10px] font-medium">
                      {g.client.name
                        .split(" ")
                        .filter((w) => /[A-Za-zÅÄÖåäö]/.test(w[0] ?? ""))
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <p className="text-[14px]">{g.client.name}</p>
                    <span className="text-[12px] text-ink3">
                      {g.items.length} underlag
                    </span>
                  </div>
                  <Link
                    href={`/revisor/klient/${g.client.id}`}
                    className="text-[12.5px] text-ink2 hover:text-ink"
                  >
                    Öppna klient
                  </Link>
                </div>
                <div className="divide-y divide-line">
                  {g.items.map(({ tx, client }) => (
                    <InboxRow key={tx.id} tx={tx} client={client} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
