"use client";

import Link from "next/link";
import { ArrowUpRight, Check, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Client } from "@/lib/types";

export function KlientRow({ client }: { client: Client }) {
  const hot = client.missingCount >= 3 || !client.fortnoxSynced;
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
      className="grid grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-4 px-5 py-4 row-hover hover:bg-paper2 group"
      style={{ ["--row-pl" as never]: "1.25rem" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper2 border hairline text-[12px] font-medium">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] truncate">{client.name}</p>
          <p className="mono text-[11.5px] text-ink3">{client.orgNr}</p>
        </div>
      </div>

      <div>
        {client.missingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 mono text-[13px] text-red">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red" />
            {client.missingCount} saknar
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-green">
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            Allt på plats
          </span>
        )}
      </div>

      <div>
        {inkomna > 0 ? (
          <span className="inline-flex items-center gap-1.5 mono text-[13px] text-amber">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
            {inkomna} att bokföra
          </span>
        ) : (
          <span className="text-[13px] text-ink3">—</span>
        )}
      </div>

      <div>
        {client.fortnoxSynced ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink2">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-soft text-green">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            Fortnox synkad
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-red">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-soft text-red">
              <X className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            Ej synkad
          </span>
        )}
      </div>

      <div className="mono text-[13px] text-ink2">{formatDate(client.lastActive)}</div>

      <div className="flex items-center gap-2 justify-end">
        {hot ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-red bg-red-soft border border-red/15 rounded-full px-1.5 py-0.5">
            Åtgärd
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper2 border hairline text-ink3 group-hover:text-ink group-hover:bg-paper3 transition-colors",
          )}
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.6} />
        </span>
      </div>
    </Link>
  );
}
