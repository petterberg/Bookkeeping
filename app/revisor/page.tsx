"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Check, Inbox, Send, Users, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { Topbar } from "@/components/revisor/Sidebar";
import { KlientRow } from "@/components/revisor/KlientRow";
import { formatDate, formatRelative } from "@/lib/utils";
import type { Client } from "@/lib/types";

export default function RevisorDashboard() {
  const { state } = useApp();
  const clients = state.revisor.clients;

  const totalMissing = clients.reduce((a, c) => a + c.missingCount, 0);
  const totalInkomna = clients.reduce(
    (a, c) => a + c.transactions.filter((t) => t.status === "inkommen").length,
    0,
  );
  const totalBokforda = clients.reduce(
    (a, c) => a + c.transactions.filter((t) => t.status === "bokford").length,
    0,
  );
  const oppna = clients.reduce(
    (a, c) => a + c.messages.filter((m) => m.from === "klient" && !m.read).length,
    0,
  );

  const sortedClients = [...clients].sort((a, b) => {
    if (a.fortnoxSynced !== b.fortnoxSynced) return a.fortnoxSynced ? 1 : -1;
    if (a.missingCount !== b.missingCount) return b.missingCount - a.missingCount;
    return a.lastActive < b.lastActive ? 1 : -1;
  });

  return (
    <>
      <Topbar
        subtitle="God morgon, Anna"
        title="Översikt"
        meta={
          <>
            {clients.length} klienter · period mars 2026 ·{" "}
            <span className="text-ink2">
              {totalMissing} underlag saknas, {totalInkomna} redo att bokföras
            </span>
          </>
        }
      />

      <div className="px-4 lg:px-8 xl:px-10 py-6 space-y-8">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Klienter" value={clients.length} icon={<Users className="h-4 w-4" strokeWidth={1.6} />} />
          <Stat label="Saknar underlag" value={totalMissing} tone={totalMissing > 0 ? "red" : "neutral"} />
          <Stat
            label="Redo att bokföra"
            value={totalInkomna}
            tone={totalInkomna > 0 ? "amber" : "neutral"}
            cta={{ label: "Öppna inkorg", href: "/revisor/inkorg", icon: <Inbox className="h-3.5 w-3.5" /> }}
          />
          <Stat label="Bokförda i mars" value={totalBokforda} tone="green" />
        </section>

        <section>
          <div className="flex items-end justify-between mb-3 gap-3">
            <div className="min-w-0">
              <h2 className="display text-[22px] lg:text-[24px] leading-tight">Klienter</h2>
              <p className="text-[12.5px] text-ink3 mt-0.5">
                Sorterade efter behov av åtgärd
              </p>
            </div>
            <div className="text-[12px] text-ink3 text-right shrink-0">
              {oppna > 0 ? `${oppna} olästa` : "Inga olästa"}
            </div>
          </div>

          {/* Desktop-tabell */}
          <div className="hidden lg:block rounded-xl border hairline bg-paper overflow-hidden">
            <div className="grid grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
              <div>Klient</div>
              <div>Underlag</div>
              <div>Inkorg</div>
              <div>Fortnox</div>
              <div>Senast aktiv</div>
              <div className="text-right">Öppna</div>
            </div>
            <div className="divide-y divide-line">
              {sortedClients.map((c) => (
                <KlientRow key={c.id} client={c} />
              ))}
            </div>
          </div>

          {/* Mobil-kort */}
          <div className="lg:hidden rounded-xl border hairline bg-paper overflow-hidden divide-y divide-line">
            {sortedClients.map((c) => (
              <KlientCardMobile key={c.id} client={c} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border hairline bg-paper p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="display text-[20px]">Senaste i tråden</h3>
              <Link
                href="/revisor/inkorg"
                className="text-[12.5px] text-ink2 hover:text-ink inline-flex items-center gap-1"
              >
                Allt aktivt <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {clients
                .flatMap((c) =>
                  c.messages.map((m) => ({ ...m, client: c })),
                )
                .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                .slice(0, 5)
                .map((m) => (
                  <li key={m.id} className="py-3 flex items-start gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper2 border hairline text-[10px] font-medium shrink-0">
                      {m.from === "revisor" ? "AJ" : m.client.contactName.split(" ").map((p) => p[0]).join("")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink truncate">
                        <span className="text-ink3">{m.client.name} ·</span> {m.text}
                      </p>
                      <p className="text-[11.5px] text-ink3 mt-0.5">
                        {m.from === "revisor" ? "Du" : m.client.contactName} · {formatRelative(m.timestamp)}
                      </p>
                    </div>
                    <Link
                      href={`/revisor/klient/${m.client.id}`}
                      className="text-[12px] text-ink3 hover:text-ink inline-flex items-center gap-1"
                    >
                      Öppna <ArrowRight className="h-3 w-3" strokeWidth={1.7} />
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-xl border hairline bg-ink text-paper p-4 lg:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between text-paper/70 text-[11px] uppercase tracking-[0.14em]">
              <span>Påminnelse</span>
              <Send className="h-3.5 w-3.5" strokeWidth={1.6} />
            </div>
            <p className="display text-[26px] leading-tight">
              {totalMissing > 0
                ? `${totalMissing} underlag saknas hos ${clients.filter((c) => c.missingCount > 0).length} klienter.`
                : "Allt är på plats. Fika!"}
            </p>
            <p className="text-[13px] text-paper/75">
              Skicka en samlad påminnelse så stänger ni mars i tid.
            </p>
            <button
              type="button"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-paper text-ink h-10 px-4 text-sm font-medium hover:bg-paper2"
              disabled={totalMissing === 0}
            >
              {totalMissing > 0 ? "Skicka påminnelser" : "Inget att påminna om"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function KlientCardMobile({ client }: { client: Client }) {
  const initials = client.name
    .split(" ")
    .filter((w) => /[A-Za-zÅÄÖåäö]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const inkomna = client.transactions.filter((t) => t.status === "inkommen").length;
  return (
    <Link
      href={`/revisor/klient/${client.id}`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper2 active:bg-paper2 transition-colors"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper2 border hairline text-[12px] font-medium shrink-0">
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[14.5px] truncate">{client.name}</p>
          <span className="mono text-[11px] text-ink3 shrink-0">{formatDate(client.lastActive)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11.5px] flex-wrap">
          {client.missingCount > 0 ? (
            <span className="inline-flex items-center gap-1 mono text-red">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red" />
              {client.missingCount} saknar
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-green">
              <Check className="h-3 w-3" strokeWidth={2.4} /> Allt på plats
            </span>
          )}
          {inkomna > 0 ? (
            <span className="inline-flex items-center gap-1 mono text-amber">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
              {inkomna} att bokföra
            </span>
          ) : null}
          {client.fortnoxSynced ? (
            <span className="inline-flex items-center gap-1 text-ink3">
              <Check className="h-3 w-3" strokeWidth={2.2} /> Fortnox
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red">
              <X className="h-3 w-3" strokeWidth={2.2} /> ej synkad
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-ink4 shrink-0" strokeWidth={1.6} />
    </Link>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  icon,
  cta,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "red" | "amber" | "green";
  icon?: React.ReactNode;
  cta?: { label: string; href: string; icon?: React.ReactNode };
}) {
  const tones = {
    neutral: "bg-paper2 text-ink",
    red: "bg-red-soft text-red",
    amber: "bg-amber-soft text-amber",
    green: "bg-green-soft text-green",
  } as const;
  return (
    <div className={`rounded-xl border hairline p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] uppercase tracking-[0.14em] opacity-80">{label}</p>
        {icon ? <span className="opacity-70">{icon}</span> : null}
      </div>
      <p className="display text-[40px] leading-none mt-2 mono">{value}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] hover:underline"
        >
          {cta.icon}
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
