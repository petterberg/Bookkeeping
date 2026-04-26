"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Wallet, CheckCircle2, Clock, X } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { SalaryBadge } from "@/components/klient/SalaryBadge";
import { cn, formatAmount, formatDate, uid } from "@/lib/utils";
import { estimateSalary } from "@/lib/salary";
import type { SalaryRequest } from "@/lib/types";

const MONTHS_SV = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  const idx = Number(m) - 1;
  return `${MONTHS_SV[idx] ?? m} ${y}`;
}

function nextMonth(): string {
  const d = new Date();
  d.setDate(1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function LonPage() {
  const client = useCurrentClient();
  const { dispatch, toast } = useApp();

  const [month, setMonth] = useState<string>(nextMonth());
  const [gross, setGross] = useState<number>(client.defaultGrossSalary ?? 38000);
  const [expenses, setExpenses] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const pending = client.salaryRequests.find((s) => s.status === "begart");
  const monthTaken = client.salaryRequests.some((s) => s.month === month);

  const est = useMemo(() => estimateSalary(gross), [gross]);

  function submit() {
    if (gross <= 0 || monthTaken || pending) return;
    setSubmitting(true);
    const req: SalaryRequest = {
      id: uid("sr"),
      month,
      grossAmount: gross,
      benefits: 0,
      expenseClaims: expenses,
      estimatedNet: est.net,
      estimatedTax: est.tax,
      estimatedEmployerFees: est.employerFees,
      status: "begart",
      requestedAt: new Date().toISOString(),
      note: note.trim() || undefined,
    };
    dispatch({ type: "add_salary_request", clientId: client.id, request: req });
    toast(`Löneuttag begärt för ${formatMonth(month)}`, "success");
    setTimeout(() => {
      setSubmitting(false);
      setNote("");
      setExpenses(0);
    }, 250);
  }

  const sortedHistory = [...client.salaryRequests].sort((a, b) =>
    a.requestedAt < b.requestedAt ? 1 : -1,
  );

  return (
    <div className="px-5 pb-6">
      <header className="pt-5 pb-3 flex items-center gap-3">
        <Link
          href="/klient"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border hairline bg-paper2 hover:bg-paper3 focus-ring"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Link>
        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink3">Löneuttag</p>
          <h1 className="display text-[26px] leading-tight">Begär lön</h1>
        </div>
      </header>

      {pending ? (
        <section className="rounded-xl border border-amber/15 bg-amber-soft text-amber p-4 mt-2">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper/60 shrink-0">
              <Clock className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium">
                Inväntar Anna · {formatMonth(pending.month)}
              </p>
              <p className="text-[12.5px] opacity-90 mt-0.5">
                Begärt {formatDate(pending.requestedAt.slice(0, 10))} ·{" "}
                {formatAmount(pending.grossAmount)} brutto
              </p>
              {pending.note ? (
                <p className="text-[12px] opacity-80 mt-1.5 italic">"{pending.note}"</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className={cn("rounded-xl border hairline bg-paper2 p-4 mt-3", pending ? "opacity-70" : "")}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] uppercase tracking-[0.14em] text-ink3">Nytt löneuttag</p>
          {monthTaken && !pending ? (
            <span className="text-[11.5px] text-amber">Lön finns redan för månaden</span>
          ) : null}
        </div>

        <Field label="Månad">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={!!pending}
            className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring"
          >
            {nextSixMonths().map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <Field label="Bruttolön">
            <input
              type="number"
              min={0}
              step={500}
              value={gross}
              onChange={(e) => setGross(Number(e.target.value) || 0)}
              disabled={!!pending}
              className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring mono"
            />
          </Field>
          <Field label="Utlägg att ersätta">
            <input
              type="number"
              min={0}
              step={100}
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value) || 0)}
              disabled={!!pending}
              className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring mono"
            />
          </Field>
        </div>

        <Field label="Anteckning till revisorn (valfri)" className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!!pending}
            rows={2}
            placeholder="T.ex. semester eller bonus"
            className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring resize-none"
          />
        </Field>

        <div className="rounded-lg bg-paper border hairline p-3 mt-3 space-y-1.5">
          <p className="text-[11.5px] uppercase tracking-[0.12em] text-ink3 mb-1">
            Preliminär beräkning
          </p>
          <Row label="Nettolön (in på ditt konto)" value={formatAmount(est.net + expenses)} />
          <Row label="Preliminärskatt (ca 31 %)" value={`− ${formatAmount(est.tax)}`} muted />
          <Row label="Arbetsgivaravgifter" value={`+ ${formatAmount(est.employerFees)}`} muted />
          <div className="border-t hairline pt-1.5 mt-1.5">
            <Row
              label="Total kostnad för bolaget"
              value={formatAmount(est.totalCost + expenses)}
              bold
            />
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-3"
          onClick={submit}
          disabled={!!pending || gross <= 0 || monthTaken || submitting}
        >
          <Send className="h-4 w-4" strokeWidth={1.7} />
          {pending ? "Inväntar Anna" : "Skicka begäran till Anna"}
        </Button>
        <p className="text-[11px] text-ink3 mt-2 text-center">
          Anna granskar, godkänner och bokför enligt skatteregler. Du får en notis när lönen kan betalas ut.
        </p>
      </section>

      <section className="mt-5">
        <h3 className="display text-[20px] mb-2">Historik</h3>
        {sortedHistory.length === 0 ? (
          <div className="rounded-xl border hairline bg-paper2 p-5 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper border hairline mb-2">
              <Wallet className="h-4 w-4 text-ink3" strokeWidth={1.6} />
            </span>
            <p className="text-[14px]">Inga tidigare löneuttag</p>
            <p className="text-[12px] text-ink3 mt-1">När du begärt din första lön visas den här.</p>
          </div>
        ) : (
          <div className="rounded-xl border hairline bg-paper2 overflow-hidden divide-y divide-line">
            {sortedHistory.map((s) => (
              <SalaryRow key={s.id} request={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function nextSixMonths(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 6; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function SalaryRow({ request }: { request: SalaryRequest }) {
  const Icon =
    request.status === "utbetald"
      ? CheckCircle2
      : request.status === "godkand"
      ? CheckCircle2
      : request.status === "avvisad"
      ? X
      : Clock;
  const tone =
    request.status === "utbetald"
      ? "text-green"
      : request.status === "avvisad"
      ? "text-red"
      : request.status === "begart"
      ? "text-amber"
      : "text-ink2";

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper border hairline shrink-0", tone)}>
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14.5px]">{formatMonth(request.month)}</p>
            <SalaryBadge status={request.status} />
          </div>
          <p className="mono text-[12px] text-ink3 mt-0.5">
            {formatAmount(request.grossAmount)} brutto · netto {formatAmount(request.estimatedNet)}
          </p>
          {request.paidAt ? (
            <p className="text-[12px] text-green mt-1">Utbetald {formatDate(request.paidAt)}</p>
          ) : null}
          {request.decisionNote ? (
            <p className="text-[12px] text-ink2 mt-1 italic">"{request.decisionNote}"</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[11.5px] text-ink3 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className={cn(muted ? "text-ink3" : "text-ink2", bold && "text-ink")}>{label}</span>
      <span className={cn("mono", muted ? "text-ink3" : "text-ink", bold && "text-[15px]")}>
        {value}
      </span>
    </div>
  );
}
