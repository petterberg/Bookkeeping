"use client";

import Link from "next/link";
import { Check, X, Wallet, Banknote } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, formatAmount, formatDate, uid } from "@/lib/utils";
import type { Client, SalaryRequest } from "@/lib/types";

const MONTHS_SV = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
function fmtMonth(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  return `${MONTHS_SV[Number(m) - 1] ?? m} ${y}`;
}

export function SalaryInboxRow({
  request,
  client,
}: {
  request: SalaryRequest;
  client: Client;
}) {
  const { dispatch, toast } = useApp();

  function godkann() {
    dispatch({
      type: "update_salary_status",
      clientId: client.id,
      requestId: request.id,
      status: "godkand",
    });
    dispatch({
      type: "add_message",
      clientId: client.id,
      message: {
        id: uid("m"),
        from: "revisor",
        text: `Hej ${client.contactName.split(" ")[0]}! Jag har godkänt löneuttaget för ${fmtMonth(request.month)} (${formatAmount(request.grossAmount)} brutto). Lönen är klar att betalas ut.`,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
    toast(`Godkänt löneuttag · ${fmtMonth(request.month)}`, "success");
  }

  function utbetald() {
    dispatch({
      type: "update_salary_status",
      clientId: client.id,
      requestId: request.id,
      status: "utbetald",
    });
    toast(`Markerat utbetalt · ${formatAmount(request.estimatedNet)}`, "success");
  }

  function avvisa() {
    dispatch({
      type: "update_salary_status",
      clientId: client.id,
      requestId: request.id,
      status: "avvisad",
      decisionNote: "Behöver mer info – jag skriver i chatten.",
    });
    dispatch({
      type: "add_message",
      clientId: client.id,
      message: {
        id: uid("m"),
        from: "revisor",
        text: `Hej! Jag behöver mer info innan jag kan godkänna löneuttaget för ${fmtMonth(request.month)}. Kan du höra av dig?`,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
    toast("Avvisad – meddelande skickat till klient");
  }

  const isApproved = request.status === "godkand";
  const isPending = request.status === "begart";

  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 items-center px-5 py-4 hover:bg-paper2 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-soft text-amber border border-amber/15">
          <Wallet className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <p className="text-[14.5px] truncate">
            Löneuttag · {fmtMonth(request.month)}
          </p>
          <p className="text-[12px] text-ink3 truncate">
            {client.name} · begärt {formatDate(request.requestedAt.slice(0, 10))}
            {request.note ? ` · "${request.note}"` : ""}
          </p>
        </div>
      </div>

      <div className="text-[12.5px] text-ink2 leading-tight">
        <p>
          <span className="text-ink3">Brutto</span>{" "}
          <span className="mono text-ink">{formatAmount(request.grossAmount)}</span>
        </p>
        <p>
          <span className="text-ink3">Skatt</span>{" "}
          <span className="mono">{formatAmount(request.estimatedTax)}</span>
          <span className="text-ink3 ml-2">Arb.giv.</span>{" "}
          <span className="mono">{formatAmount(request.estimatedEmployerFees)}</span>
        </p>
      </div>

      <div className="mono text-[14px] text-ink">
        Netto {formatAmount(request.estimatedNet + (request.expenseClaims ?? 0))}
      </div>

      <div className="flex items-center gap-1.5 justify-end">
        <Link
          href={`/revisor/klient/${client.id}`}
          className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-full text-[12.5px] text-ink2 hover:bg-paper3"
        >
          Öppna klient
        </Link>
        {isPending ? (
          <>
            <button
              type="button"
              onClick={avvisa}
              className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-full text-[12.5px] text-ink2 hover:bg-paper3"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.7} />
              Avvisa
            </button>
            <button
              type="button"
              onClick={godkann}
              className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full bg-ink text-paper text-[12.5px] hover:bg-ink2"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
              Godkänn
            </button>
          </>
        ) : null}
        {isApproved ? (
          <button
            type="button"
            onClick={utbetald}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 px-3 rounded-full text-[12.5px] bg-green text-paper hover:opacity-90",
            )}
          >
            <Banknote className="h-3.5 w-3.5" strokeWidth={1.7} />
            Markera utbetald
          </button>
        ) : null}
      </div>
    </div>
  );
}
