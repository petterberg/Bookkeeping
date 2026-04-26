"use client";

import Link from "next/link";
import { Check, AlertCircle, CircleDashed, Inbox, ChevronRight } from "lucide-react";
import { cn, formatAmount, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const icons = {
  saknar_underlag: AlertCircle,
  inkommen: Inbox,
  bokford: Check,
  ok: CircleDashed,
} as const;

const colors = {
  saknar_underlag: "text-red",
  inkommen: "text-amber",
  bokford: "text-green",
  ok: "text-ink3",
} as const;

export function TxRow({ tx, href }: { tx: Transaction; href?: string }) {
  const Icon = icons[tx.status];
  const iconClass = colors[tx.status];
  const isIncome = tx.amount > 0;
  const target = href ?? (tx.status === "saknar_underlag" ? `/klient/ladda-upp?txId=${tx.id}` : undefined);

  const inner = (
    <div className="flex items-center gap-3 py-3.5 px-4 row-hover" style={{ ["--row-pl" as never]: "1rem" }}>
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper2 border hairline", iconClass)}>
        <Icon className="h-4 w-4" strokeWidth={1.7} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[15px] text-ink">{tx.description}</p>
          <span className={cn("mono text-[14px] tabular-nums", isIncome ? "text-green" : "text-ink")}>
            {formatAmount(tx.amount, { sign: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <p className="mono text-[11.5px] text-ink3">{formatDate(tx.date)}</p>
          <span className={cn("text-[11.5px]", iconClass)}>
            {tx.status === "saknar_underlag" && "Saknar underlag"}
            {tx.status === "inkommen" && "Inkommen hos revisor"}
            {tx.status === "bokford" && "Bokförd"}
            {tx.status === "ok" && "Klar"}
          </span>
        </div>
      </div>
      {target ? <ChevronRight className="h-4 w-4 text-ink4" strokeWidth={1.6} /> : null}
    </div>
  );

  if (target) {
    return (
      <Link href={target} className="block focus-ring rounded-lg">
        {inner}
      </Link>
    );
  }
  return <div className="block">{inner}</div>;
}
