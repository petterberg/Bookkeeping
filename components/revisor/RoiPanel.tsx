"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, formatAmount } from "@/lib/utils";

// Antaganden bakom räknaren — enkla att justera:
const HOURLY_RATE_SEK = 850; // typisk fakturerad timpris för junior
const MIN_PER_AUTO_MATCH = 3; // matchat underlag från CSV-import → 3 min sparat
const MIN_PER_AUTO_POSTING = 2; // bokförd med kontoförslag → 2 min sparat
const MIN_PER_LEARNED_HIT = 1; // varje gång en lärd regel träffar → 1 min sparat
const HOURS_PER_KLIENT_MONTH = 1.5; // uppskattad tid per klient / månad utan Räkna

export function RoiPanel() {
  const { state } = useApp();
  const clients = state.revisor.clients;

  let autoMatched = 0;
  let autoPostings = 0;
  let learnedHits = 0;

  for (const c of clients) {
    autoMatched += c.transactions.filter((t) => t.orphanId).length;
    autoPostings += c.transactions.filter(
      (t) => t.status === "bokford" && t.posting,
    ).length;
    learnedHits += c.learnedRules.reduce((a, r) => a + r.count, 0);
  }

  const minutesSaved =
    autoMatched * MIN_PER_AUTO_MATCH +
    autoPostings * MIN_PER_AUTO_POSTING +
    learnedHits * MIN_PER_LEARNED_HIT;
  const hoursSaved = minutesSaved / 60;
  const sekSaved = Math.round(hoursSaved * HOURLY_RATE_SEK);
  const extraClientsCapacity = Math.floor(hoursSaved / HOURS_PER_KLIENT_MONTH);

  return (
    <section className="rounded-xl border hairline bg-ink text-paper p-5 lg:p-6 overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-end gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-paper/60 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" strokeWidth={1.7} />
            Räknas tidsvinst · mars 2026
          </p>
          <h2 className="display text-[42px] lg:text-[54px] leading-none tracking-tightish mt-2">
            {hoursSaved.toFixed(1).replace(".", ",")}{" "}
            <span className="text-paper/60">h sparade</span>
          </h2>
          <p className="text-[13px] text-paper/75 mt-2 max-w-[52ch]">
            Motsvarar{" "}
            <span className="text-paper mono">{formatAmount(sekSaved)}</span> i
            fakturerad tid — eller kapacitet för{" "}
            <span className="text-paper mono">
              {extraClientsCapacity} fler {extraClientsCapacity === 1 ? "klient" : "klienter"}
            </span>{" "}
            utan att anställa.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:gap-4 lg:w-[420px] shrink-0">
          <RoiChip
            label="Underlag matchade"
            value={autoMatched}
            hint={`${MIN_PER_AUTO_MATCH} min ⁄ st`}
          />
          <RoiChip
            label="Bokförda med förslag"
            value={autoPostings}
            hint={`${MIN_PER_AUTO_POSTING} min ⁄ st`}
          />
          <RoiChip
            label="Lärda regel-träffar"
            value={learnedHits}
            hint={`${MIN_PER_LEARNED_HIT} min ⁄ st`}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-paper/15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-[12.5px] text-paper/70">
        <p>
          Timpris antaget: <span className="text-paper mono">{formatAmount(HOURLY_RATE_SEK)}⁄h</span> ·
          klient ≈ <span className="text-paper mono">{HOURS_PER_KLIENT_MONTH.toString().replace(".", ",")} h⁄mån</span>
        </p>
        <Link
          href="/revisor/inkorg"
          className="inline-flex items-center gap-1.5 text-paper hover:underline"
        >
          Se vad som kan bokföras just nu
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
        </Link>
      </div>
    </section>
  );
}

function RoiChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-paper/10 border border-paper/15 px-3 py-3",
      )}
    >
      <p className="text-[10.5px] uppercase tracking-[0.12em] text-paper/60 leading-tight">
        {label}
      </p>
      <p className="display text-[28px] leading-none mt-1.5 mono">{value}</p>
      <p className="text-[10.5px] text-paper/60 mono mt-1.5">{hint}</p>
    </div>
  );
}
