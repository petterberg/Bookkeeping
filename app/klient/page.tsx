"use client";

import Link from "next/link";
import { ArrowRight, Bell, LineChart, ReceiptText, Wallet } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { Logo } from "@/components/ui/Logo";
import { StatusCard } from "@/components/klient/StatusCard";
import { TxRow } from "@/components/klient/TxRow";
import { MissingAlert } from "@/components/klient/MissingAlert";
import { Divider } from "@/components/ui/Card";
import { REVISOR } from "@/lib/mock-data";
import { formatAmount } from "@/lib/utils";

export default function KlientHemPage() {
  const client = useCurrentClient();
  const { state } = useApp();

  const missing = client.transactions.filter((t) => t.status === "saknar_underlag").length;
  const inkomna = client.transactions.filter((t) => t.status === "inkommen").length;
  const bokforda = client.transactions.filter((t) => t.status === "bokford").length;

  const sorted = [...client.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const senaste = sorted.slice(0, 6);

  const unread = client.messages.filter((m) => m.from === "revisor" && !m.read).length;

  return (
    <div className="px-5">
      <header className="pt-5 pb-3 flex items-center justify-between">
        <Logo size="sm" href="/" />
        <div className="flex items-center gap-2">
          <Link
            href="/klient/meddelanden"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border hairline bg-paper2 hover:bg-paper3 focus-ring"
            aria-label="Meddelanden"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red text-paper text-[10px] px-1 font-medium">
                {unread}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <section className="pt-3 pb-5">
        <p className="text-[13px] text-ink3">
          Hej, <span className="text-ink">{client.contactName.split(" ")[0]}</span>
        </p>
        <h1 className="display text-[34px] leading-[1.05] mt-1">
          {client.name}
          <span className="display-italic text-ink3 text-[20px]">  ·  {client.orgNr}</span>
        </h1>
      </section>

      <StatusCard missing={missing} inkomna={inkomna} bokforda={bokforda} />

      <section className="mt-4">
        <MissingAlert client={client} />
      </section>

      <section className="mt-6">
        <div className="grid grid-cols-3 gap-2.5">
          <Link
            href="/klient/ekonomi"
            className="rounded-xl border hairline bg-paper2 hover:bg-paper3 transition-colors p-3 flex flex-col gap-2 focus-ring"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper border hairline">
              <LineChart className="h-[15px] w-[15px]" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[13.5px] text-ink leading-tight">Ekonomi</span>
              <span className="block text-[11px] text-ink3 mt-0.5 mono">
                {formatAmount(client.cashflow[client.cashflow.length - 1]?.saldo ?? 0)}
              </span>
            </span>
          </Link>
          <Link
            href="/klient/faktura"
            className="rounded-xl border hairline bg-paper2 hover:bg-paper3 transition-colors p-3 flex flex-col gap-2 focus-ring"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper border hairline">
              <ReceiptText className="h-[15px] w-[15px]" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[13.5px] text-ink leading-tight">Fakturor</span>
              <span className="block text-[11px] text-ink3 mt-0.5">
                {client.invoices.filter((i) => i.status === "skickad" || i.status === "forfallen").length} utestående
              </span>
            </span>
          </Link>
          <Link
            href="/klient/lon"
            className="rounded-xl border hairline bg-paper2 hover:bg-paper3 transition-colors p-3 flex flex-col gap-2 focus-ring"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper border hairline">
              <Wallet className="h-[15px] w-[15px]" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[13.5px] text-ink leading-tight">Löneuttag</span>
              <span className="block text-[11px] text-ink3 mt-0.5">
                {client.salaryRequests.find((s) => s.status === "begart") ? "Väntar svar" : "Begär lön"}
              </span>
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between mb-2">
          <h3 className="display text-[22px]">Senaste händelser</h3>
          <span className="text-[12px] text-ink3">{state.revisor.clients[0].bank}</span>
        </div>
        <div className="rounded-xl border hairline bg-paper2 overflow-hidden divide-y divide-line">
          {senaste.map((tx) => (
            <TxRow key={tx.id} tx={tx} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[12px] text-ink3">
            {client.transactions.length} transaktioner i mars
          </p>
          <Link href="/klient/ladda-upp" className="text-[13px] inline-flex items-center gap-1 text-ink hover:underline">
            Hantera kvitton <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
          </Link>
        </div>
      </section>

      <section className="mt-8 mb-2 rounded-xl border hairline bg-paper2 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 rounded-full bg-ink text-paper items-center justify-center text-[12px] font-medium">
            {REVISOR.name
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-ink3">Din revisor</p>
            <p className="text-[15px] truncate">{REVISOR.name}</p>
          </div>
          <Link
            href="/klient/meddelanden"
            className="text-[13px] inline-flex items-center gap-1 text-ink hover:underline"
          >
            Skriv <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
          </Link>
        </div>
        <Divider className="my-3" />
        <p className="text-[13px] text-ink2 leading-relaxed">
          {REVISOR.firm} sköter din bokföring varje månad. Du behöver bara ladda upp underlag i tid.
        </p>
      </section>
    </div>
  );
}
