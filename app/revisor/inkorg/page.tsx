"use client";

import Link from "next/link";
import { Inbox, Wallet } from "lucide-react";
import { useApp } from "@/lib/store";
import { Topbar } from "@/components/revisor/Sidebar";
import { InboxRow } from "@/components/revisor/InboxRow";
import { SalaryInboxRow } from "@/components/revisor/SalaryInboxRow";
import type { Client, SalaryRequest, Transaction } from "@/lib/types";

export default function InkorgPage() {
  const { state } = useApp();

  const items: { tx: Transaction; client: Client }[] = state.revisor.clients.flatMap((c) =>
    c.transactions
      .filter((t) => t.status === "inkommen")
      .map((tx) => ({ tx, client: c })),
  );

  const salaryItems: { request: SalaryRequest; client: Client }[] =
    state.revisor.clients.flatMap((c) =>
      c.salaryRequests
        .filter((s) => s.status === "begart" || s.status === "godkand")
        .map((request) => ({ request, client: c })),
    );

  const totalAmount = items.reduce((a, x) => a + Math.abs(x.tx.amount), 0);
  const grouped = state.revisor.clients
    .map((c) => ({ client: c, items: items.filter((i) => i.client.id === c.id) }))
    .filter((g) => g.items.length > 0);

  const empty = items.length === 0 && salaryItems.length === 0;

  const headlineParts: string[] = [];
  if (items.length > 0) headlineParts.push(`${items.length} underlag`);
  if (salaryItems.length > 0) headlineParts.push(`${salaryItems.length} löneuttag`);

  return (
    <>
      <Topbar
        subtitle="Inkorg"
        title={empty ? "Inget i inkorgen" : `${headlineParts.join(" · ")} att hantera`}
        meta={
          empty
            ? "Du är ifatt. Snyggt jobbat."
            : `${grouped.length} klienter underlag · ${
                salaryItems.filter((s) => s.request.status === "begart").length
              } löneuttag väntar · totalt ${new Intl.NumberFormat("sv-SE").format(Math.round(totalAmount))} kr i underlag`
        }
      />

      <div className="px-8 lg:px-10 py-6">
        {empty ? (
          <div className="rounded-xl border hairline bg-paper2 p-10 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper border hairline mb-3">
              <Inbox className="h-5 w-5 text-ink3" strokeWidth={1.5} />
            </span>
            <p className="display text-[24px]">Inkorgen är tom</p>
            <p className="text-[13px] text-ink3 mt-1 max-w-[36ch] mx-auto">
              När klienter laddar upp underlag eller begär lön dyker de upp här.
            </p>
            <Link
              href="/revisor"
              className="inline-flex items-center gap-1.5 mt-4 text-[13px] text-ink hover:underline"
            >
              Tillbaka till översikt
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {salaryItems.length > 0 ? (
              <section>
                <div className="flex items-end justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-soft text-amber border border-amber/15">
                      <Wallet className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </span>
                    <h2 className="display text-[22px] leading-tight">Löneuttag</h2>
                    <span className="text-[12px] text-ink3">
                      {salaryItems.filter((s) => s.request.status === "begart").length} väntar på godkännande
                      {salaryItems.filter((s) => s.request.status === "godkand").length > 0
                        ? ` · ${salaryItems.filter((s) => s.request.status === "godkand").length} klar att betala`
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border hairline bg-paper overflow-hidden">
                  <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
                    <div>Begäran</div>
                    <div>Brutto · skatt · arb.giv.</div>
                    <div>Netto</div>
                    <div className="text-right">Åtgärd</div>
                  </div>
                  <div className="divide-y divide-line">
                    {salaryItems.map(({ request, client }) => (
                      <SalaryInboxRow key={request.id} request={request} client={client} />
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {grouped.length > 0 ? (
              <section>
                <div className="flex items-end justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper2 border hairline text-ink3">
                      <Inbox className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </span>
                    <h2 className="display text-[22px] leading-tight">Underlag</h2>
                    <span className="text-[12px] text-ink3">
                      {items.length} st redo att bokföras · grupperade per klient
                    </span>
                  </div>
                </div>
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
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
