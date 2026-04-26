"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowDownRight, ReceiptText, Wallet, TrendingUp } from "lucide-react";
import { useCurrentClient } from "@/lib/store";
import { CashflowSaldoChart, InOutBarChart } from "@/components/klient/CashflowChart";
import { cn, formatAmount } from "@/lib/utils";

export default function EkonomiPage() {
  const client = useCurrentClient();
  const flows = client.cashflow;
  const last = flows[flows.length - 1];
  const prev = flows[flows.length - 2];

  const result = last ? last.income - last.expenses : 0;
  const resultPrev = prev ? prev.income - prev.expenses : 0;
  const resultDelta = resultPrev !== 0 ? Math.round(((result - resultPrev) / Math.abs(resultPrev)) * 100) : 0;

  const utestaende = client.invoices
    .filter((i) => i.status === "skickad" || i.status === "forfallen")
    .reduce((a, i) => a + i.total, 0);
  const forfallna = client.invoices.filter((i) => i.status === "forfallen").length;

  const saldoChange = last && prev ? last.saldo - prev.saldo : 0;

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
        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink3">Ekonomi</p>
          <h1 className="display text-[26px] leading-tight">Senaste 6 månaderna</h1>
        </div>
      </header>

      <section className="rounded-xl border hairline bg-ink text-paper p-5 mt-2">
        <p className="text-[11.5px] uppercase tracking-[0.14em] text-paper/60">Saldo just nu</p>
        <p className="display text-[42px] leading-none mt-1.5 mono">
          {formatAmount(last?.saldo ?? 0)}
        </p>
        <p className="text-[12.5px] mt-2 text-paper/75 inline-flex items-center gap-1.5">
          {saldoChange >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-green" strokeWidth={1.8} />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-red" strokeWidth={1.8} />
          )}
          {saldoChange >= 0 ? "+" : "−"}
          {formatAmount(Math.abs(saldoChange)).replace("-", "")} sedan föregående månad
        </p>
      </section>

      <section className="mt-4 rounded-xl border hairline bg-paper2 p-4">
        <div className="flex items-end justify-between mb-1">
          <h2 className="display text-[20px]">Saldo över tid</h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink3">SEK</span>
        </div>
        <CashflowSaldoChart data={flows} />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat
          label="Intäkter mars"
          value={formatAmount(last?.income ?? 0)}
          delta={prev ? Math.round(((last!.income - prev.income) / prev.income) * 100) : 0}
          tone="green"
        />
        <Stat
          label="Utgifter mars"
          value={formatAmount(last?.expenses ?? 0)}
          delta={prev ? Math.round(((last!.expenses - prev.expenses) / prev.expenses) * 100) : 0}
          tone="red"
          invert
        />
        <Stat
          label="Resultat mars"
          value={formatAmount(result)}
          delta={resultDelta}
          tone={result >= 0 ? "green" : "red"}
        />
        <Stat
          label="Utestående fakturor"
          value={formatAmount(utestaende)}
          extra={forfallna > 0 ? `${forfallna} förfallen${forfallna === 1 ? "" : "a"}` : "Inga förfallna"}
          tone={forfallna > 0 ? "amber" : "neutral"}
        />
      </section>

      <section className="mt-4 rounded-xl border hairline bg-paper2 p-4">
        <div className="flex items-end justify-between mb-1">
          <h2 className="display text-[20px]">In och ut per månad</h2>
          <div className="flex items-center gap-3 text-[11px] text-ink3">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-green" /> Intäkter
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-red" /> Utgifter
            </span>
          </div>
        </div>
        <InOutBarChart data={flows} />
      </section>

      <section className="mt-4 rounded-xl border hairline bg-paper2 p-4">
        <h3 className="display text-[18px] mb-2 inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink2" strokeWidth={1.7} />
          Insikter från Anna
        </h3>
        <ul className="space-y-2 text-[13.5px] text-ink2">
          <li className="flex gap-2">
            <span className="text-ink3 mt-0.5">·</span>
            <span>
              Mars är ditt starkaste hittills i år — driven av Tenant Group-fakturan ({formatAmount(103500)}).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-ink3 mt-0.5">·</span>
            <span>
              Drivmedel och representation ligger 18 % över snittet de senaste tre månaderna.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-ink3 mt-0.5">·</span>
            <span>
              Du kan ta ut <span className="text-ink">{formatAmount((client.defaultGrossSalary ?? 0) * 1.4)}</span> brutto i månaden utan att äventyra likvideten.
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2.5 mb-4">
        <Link
          href="/klient/faktura/ny"
          className="rounded-xl border hairline bg-paper2 hover:bg-paper3 transition-colors p-4 flex items-center justify-between focus-ring"
        >
          <div>
            <p className="text-[13px] text-ink3">Skapa</p>
            <p className="text-[16px]">Ny faktura</p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper border hairline">
            <ReceiptText className="h-4 w-4" strokeWidth={1.6} />
          </span>
        </Link>
        <Link
          href="/klient/lon"
          className="rounded-xl border hairline bg-paper2 hover:bg-paper3 transition-colors p-4 flex items-center justify-between focus-ring"
        >
          <div>
            <p className="text-[13px] text-ink3">Begär</p>
            <p className="text-[16px]">Löneuttag</p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper border hairline">
            <Wallet className="h-4 w-4" strokeWidth={1.6} />
          </span>
        </Link>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  tone = "neutral",
  invert = false,
  extra,
}: {
  label: string;
  value: string;
  delta?: number;
  tone?: "neutral" | "green" | "red" | "amber";
  invert?: boolean;
  extra?: string;
}) {
  const tones = {
    neutral: "bg-paper2 text-ink",
    green: "bg-green-soft text-green",
    red: "bg-red-soft text-red",
    amber: "bg-amber-soft text-amber",
  } as const;
  const positive = invert ? (delta ?? 0) < 0 : (delta ?? 0) >= 0;
  return (
    <div className={cn("rounded-xl border hairline p-3.5", tones[tone])}>
      <p className="text-[11.5px] uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="display text-[22px] mono leading-none mt-1.5">{value}</p>
      {extra ? (
        <p className="text-[11.5px] opacity-80 mt-1.5">{extra}</p>
      ) : delta !== undefined ? (
        <p className="text-[11.5px] mt-1.5 inline-flex items-center gap-1 opacity-80">
          {positive ? (
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          ) : (
            <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
          )}
          {delta > 0 ? "+" : ""}
          {delta}% mot februari
        </p>
      ) : null}
    </div>
  );
}
