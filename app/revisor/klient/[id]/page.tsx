"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Banknote,
  Mail,
  Calendar,
  Check,
  X,
  ListOrdered,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { ChatPanel } from "@/components/revisor/ChatPanel";
import { TxRowDesktop } from "@/components/revisor/TxRowDesktop";
import { Topbar } from "@/components/revisor/Sidebar";
import { InvoiceBadge } from "@/components/klient/InvoiceBadge";
import { SalaryBadge } from "@/components/klient/SalaryBadge";
import { SalaryInboxRow } from "@/components/revisor/SalaryInboxRow";
import { cn, formatAmount, formatDate, formatDateLong, formatRelative } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

type Tab = "transaktioner" | "fakturor" | "loner";

export default function KlientDetailPage() {
  const params = useParams<{ id: string }>();
  const { state } = useApp();
  const client = state.revisor.clients.find((c) => c.id === params.id);
  const [tab, setTab] = useState<Tab>("transaktioner");

  if (!client) return notFound();

  const sortedTx = [...client.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const utgifter = client.transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const intakter = client.transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const resultat = intakter + utgifter;
  const inkomna = client.transactions.filter((t) => t.status === "inkommen").length;

  const sortedInvoices = [...client.invoices].sort((a, b) =>
    a.issueDate < b.issueDate ? 1 : -1,
  );
  const utestaende = client.invoices
    .filter((i) => i.status === "skickad" || i.status === "forfallen")
    .reduce((a, i) => a + i.total, 0);
  const overdueInvCount = client.invoices.filter((i) => i.status === "forfallen").length;

  const sortedSalary = [...client.salaryRequests].sort((a, b) =>
    a.requestedAt < b.requestedAt ? 1 : -1,
  );
  const pendingSalary = client.salaryRequests.filter((s) => s.status === "begart").length;

  const tabs: { value: Tab; label: string; icon: typeof ListOrdered; count: number }[] = [
    { value: "transaktioner", label: "Transaktioner", icon: ListOrdered, count: client.transactions.length },
    { value: "fakturor", label: "Fakturor", icon: ReceiptText, count: client.invoices.length },
    { value: "loner", label: "Löner", icon: Wallet, count: client.salaryRequests.length },
  ];

  return (
    <>
      <Topbar
        subtitle={
          <>
            <Link href="/revisor" className="hover:underline">
              Översikt
            </Link>
            <span className="mx-1.5 text-ink4">/</span>
            <span>Klient</span>
          </>
        }
        title={client.name}
        meta={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 mono">
              <Building2 className="h-3.5 w-3.5 text-ink3" strokeWidth={1.6} />
              {client.orgNr}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-ink3" strokeWidth={1.6} />
              {client.bank}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-ink3" strokeWidth={1.6} />
              {client.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-ink3" strokeWidth={1.6} />
              senast aktiv {formatDateLong(client.lastActive)}
            </span>
            {client.fortnoxSynced ? (
              <span className="inline-flex items-center gap-1.5 text-green">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-soft">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                Fortnox synkad
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-soft">
                  <X className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                Ej Fortnox-synkad
              </span>
            )}
          </span>
        }
        actions={
          <Link
            href="/revisor"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-full text-[12.5px] text-ink2 hover:bg-paper2 border hairline"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
            Alla klienter
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-0 flex-1 min-h-0">
        <div className="px-8 lg:px-10 py-6 space-y-6 overflow-y-auto">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Saknar underlag"
              value={client.missingCount}
              tone={client.missingCount > 0 ? "red" : "neutral"}
            />
            <Stat label="Redo att bokföra" value={inkomna} tone={inkomna > 0 ? "amber" : "neutral"} />
            <Stat
              label="Utestående fakturor"
              value={formatAmount(utestaende)}
              tone={overdueInvCount > 0 ? "amber" : "neutral"}
              hint={overdueInvCount > 0 ? `${overdueInvCount} förfallen` : undefined}
            />
            <Stat
              label="Resultat mars"
              value={formatAmount(resultat)}
              tone={resultat >= 0 ? "green" : "red"}
            />
          </section>

          <div className="flex items-center gap-2 border-b hairline">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2.5 -mb-px border-b-2 transition-colors",
                    active
                      ? "border-ink text-ink"
                      : "border-transparent text-ink3 hover:text-ink",
                  )}
                >
                  <Icon className="h-[15px] w-[15px]" strokeWidth={active ? 1.9 : 1.5} />
                  <span className="text-[13.5px]">{t.label}</span>
                  <span
                    className={cn(
                      "mono text-[11px] px-1.5 py-0.5 rounded-full",
                      active ? "bg-ink text-paper" : "bg-paper2 text-ink3 border hairline",
                    )}
                  >
                    {t.count}
                  </span>
                  {t.value === "loner" && pendingSalary > 0 && !active ? (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {tab === "transaktioner" ? (
            <section>
              <div className="rounded-xl border hairline bg-paper overflow-hidden">
                <div className="grid grid-cols-[88px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
                  <div>Datum</div>
                  <div>Beskrivning</div>
                  <div>Belopp</div>
                  <div>Status</div>
                  <div className="text-right">Åtgärd</div>
                </div>
                <div className="divide-y divide-line">
                  {sortedTx.map((tx) => (
                    <TxRowDesktop
                      key={tx.id}
                      tx={tx}
                      clientId={client.id}
                      learnedRules={client.learnedRules}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-ink3 mt-2">
                Senast aktivt {formatRelative(`${client.lastActive}T09:00:00`)}
              </p>
            </section>
          ) : null}

          {tab === "fakturor" ? (
            <section>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat
                  label="Totalt fakturerat"
                  value={formatAmount(client.invoices.reduce((a, i) => a + i.total, 0))}
                />
                <Stat
                  label="Utestående"
                  value={formatAmount(utestaende)}
                  tone={utestaende > 0 ? "amber" : "neutral"}
                />
                <Stat
                  label="Förfallna"
                  value={overdueInvCount}
                  tone={overdueInvCount > 0 ? "red" : "neutral"}
                />
              </div>

              <div className="rounded-xl border hairline bg-paper overflow-hidden">
                <div className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
                  <div>Nummer</div>
                  <div>Kund</div>
                  <div>Datum / förfaller</div>
                  <div>Belopp</div>
                  <div className="text-right">Status</div>
                </div>
                <div className="divide-y divide-line">
                  {sortedInvoices.length === 0 ? (
                    <p className="px-5 py-6 text-[13px] text-ink3 text-center">
                      Inga fakturor ännu.
                    </p>
                  ) : (
                    sortedInvoices.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {tab === "loner" ? (
            <section>
              {sortedSalary.length === 0 ? (
                <div className="rounded-xl border hairline bg-paper2 p-10 text-center">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper border hairline mb-3">
                    <Wallet className="h-5 w-5 text-ink3" strokeWidth={1.5} />
                  </span>
                  <p className="display text-[22px]">Inga löneuttag</p>
                  <p className="text-[13px] text-ink3 mt-1">
                    När klienten begär lön dyker det upp här.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border hairline bg-paper overflow-hidden">
                  <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
                    <div>Begäran</div>
                    <div>Brutto · skatt · arb.giv.</div>
                    <div>Netto</div>
                    <div className="text-right">Åtgärd</div>
                  </div>
                  <div className="divide-y divide-line">
                    {sortedSalary.map((s) =>
                      s.status === "begart" || s.status === "godkand" ? (
                        <SalaryInboxRow key={s.id} request={s} client={client} />
                      ) : (
                        <SalaryHistoricRow key={s.id} request={s} />
                      ),
                    )}
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="border-l hairline xl:h-[calc(100vh-92px)] xl:sticky xl:top-[92px] min-h-[480px] flex flex-col">
          <ChatPanel client={client} />
        </aside>
      </div>
    </>
  );
}

function InvoiceRow({ inv }: { inv: Invoice }) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-center px-5 py-3.5 hover:bg-paper2 transition-colors">
      <div className="mono text-[12.5px] text-ink2">{inv.number}</div>
      <div className="min-w-0">
        <p className="text-[14px] truncate">{inv.customerName}</p>
        {inv.customerOrgNr ? (
          <p className="mono text-[11.5px] text-ink3">{inv.customerOrgNr}</p>
        ) : null}
      </div>
      <div className="text-[12.5px] text-ink2">
        <p className="mono">{formatDate(inv.issueDate)}</p>
        <p className="mono text-ink3">förfaller {formatDate(inv.dueDate)}</p>
      </div>
      <div>
        <p className="mono text-[14px]">{formatAmount(inv.total)}</p>
        <p className="text-[11.5px] text-ink3 mono">
          netto {formatAmount(inv.net)} · moms {formatAmount(inv.vat)}
        </p>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <InvoiceBadge status={inv.status} />
      </div>
    </div>
  );
}

function SalaryHistoricRow({ request }: { request: import("@/lib/types").SalaryRequest }) {
  const MONTHS_SV = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  const [y, m] = request.month.split("-");
  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 items-center px-5 py-3.5">
      <div>
        <p className="text-[14px]">Löneuttag · {MONTHS_SV[Number(m) - 1]} {y}</p>
        <p className="text-[12px] text-ink3">
          {request.paidAt ? `Utbetald ${formatDate(request.paidAt)}` : `Status ${request.status}`}
        </p>
      </div>
      <div className="text-[12.5px] text-ink2">
        <span className="text-ink3">Brutto</span>{" "}
        <span className="mono">{formatAmount(request.grossAmount)}</span>
      </div>
      <div className="mono text-[14px] text-ink">
        {formatAmount(request.estimatedNet)}
      </div>
      <div className="flex justify-end">
        <SalaryBadge status={request.status} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green";
  hint?: string;
}) {
  const tones = {
    neutral: "bg-paper2 text-ink",
    red: "bg-red-soft text-red",
    amber: "bg-amber-soft text-amber",
    green: "bg-green-soft text-green",
  } as const;
  return (
    <div className={`rounded-xl border hairline p-4 ${tones[tone]}`}>
      <p className="text-[12px] uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="display text-[28px] leading-none mt-1.5 mono">{value}</p>
      {hint ? <p className="text-[11.5px] opacity-80 mt-1.5">{hint}</p> : null}
    </div>
  );
}
