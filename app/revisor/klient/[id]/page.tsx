"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Banknote, Mail, Calendar, Check, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { ChatPanel } from "@/components/revisor/ChatPanel";
import { TxRowDesktop } from "@/components/revisor/TxRowDesktop";
import { Topbar } from "@/components/revisor/Sidebar";
import { formatAmount, formatDateLong, formatRelative } from "@/lib/utils";

export default function KlientDetailPage() {
  const params = useParams<{ id: string }>();
  const { state } = useApp();
  const client = state.revisor.clients.find((c) => c.id === params.id);
  if (!client) return notFound();

  const sortedTx = [...client.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const utgifter = client.transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const intakter = client.transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const resultat = intakter + utgifter;
  const inkomna = client.transactions.filter((t) => t.status === "inkommen").length;

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
            <Stat label="Saknar underlag" value={client.missingCount} tone={client.missingCount > 0 ? "red" : "neutral"} />
            <Stat label="Redo att bokföra" value={inkomna} tone={inkomna > 0 ? "amber" : "neutral"} />
            <Stat label="Intäkter mars" value={formatAmount(intakter)} />
            <Stat label="Resultat mars" value={formatAmount(resultat)} tone={resultat >= 0 ? "green" : "red"} />
          </section>

          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="display text-[24px] leading-tight">Transaktioner</h2>
                <p className="text-[12.5px] text-ink3 mt-0.5">
                  {client.transactions.length} st · {client.bank}
                </p>
              </div>
            </div>

            <div className="rounded-xl border hairline bg-paper overflow-hidden">
              <div className="grid grid-cols-[88px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
                <div>Datum</div>
                <div>Beskrivning</div>
                <div>Belopp</div>
                <div>Status</div>
                <div className="text-right">Åtgärd</div>
              </div>
              <div className="divide-y divide-line">
                {sortedTx.map((tx) => (
                  <TxRowDesktop key={tx.id} tx={tx} clientId={client.id} />
                ))}
              </div>
            </div>
            <p className="text-[12px] text-ink3 mt-2">
              Senast aktivt {formatRelative(`${client.lastActive}T09:00:00`)}
            </p>
          </section>
        </div>

        <aside className="border-l hairline xl:h-[calc(100vh-92px)] xl:sticky xl:top-[92px] min-h-[480px] flex flex-col">
          <ChatPanel client={client} />
        </aside>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green";
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
    </div>
  );
}
