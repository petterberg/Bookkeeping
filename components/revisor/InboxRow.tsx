"use client";

import Link from "next/link";
import { Check, Paperclip, FileText, Image as ImageIcon, ArrowUpRight, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/lib/store";
import { cn, formatAmount, formatDate, receiptTypeLabel, uid } from "@/lib/utils";
import type { Client, Transaction } from "@/lib/types";

export function InboxRow({ tx, client }: { tx: Transaction; client: Client }) {
  const { dispatch, toast } = useApp();
  const TypeIcon = tx.receiptType === "privat" ? ImageIcon : tx.receiptType === "ovrigt" ? FileText : Paperclip;

  function bokfor() {
    dispatch({
      type: "update_tx",
      clientId: client.id,
      txId: tx.id,
      patch: { status: "bokford" },
    });
    toast(`Bokförd · ${tx.description}`, "success");
  }

  function begarMer() {
    dispatch({
      type: "add_message",
      clientId: client.id,
      message: {
        id: uid("m"),
        from: "revisor",
        text: `Hej! Behöver lite mer information om "${tx.description}" (${formatAmount(tx.amount)}, ${formatDate(tx.date)}). Kan du berätta vad det gällde?`,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
    toast("Begäran om mer info skickad");
  }

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-4 items-center px-5 py-4 hover:bg-paper2 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-soft text-amber border border-amber/15")}>
          <TypeIcon className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <p className="text-[14.5px] truncate">{tx.description}</p>
          <p className="text-[12px] text-ink3 truncate">
            {client.name} · {tx.note ?? "ingen anteckning"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12.5px] text-ink2">
        <Badge tone="neutral" size="sm">
          {tx.receiptType ? receiptTypeLabel[tx.receiptType] : "Okänd typ"}
        </Badge>
        <span className="text-ink3 truncate">{tx.receiptUrl ?? "kvitto.jpg"}</span>
      </div>

      <div className="mono text-[14px] text-ink">{formatAmount(tx.amount, { sign: true })}</div>

      <div className="text-[12.5px] text-ink3">
        <span className="mono">{formatDate(tx.date)}</span>
        <span className="mx-1.5">·</span>
        <span>uppladdat nyss</span>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={begarMer}
          className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-full text-[12.5px] text-ink2 hover:bg-paper3"
          title="Begär mer info"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.7} />
          Begär info
        </button>
        <Link
          href={`/revisor/klient/${client.id}`}
          className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-full text-[12.5px] text-ink2 hover:bg-paper3"
        >
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
          Öppna
        </Link>
        <button
          type="button"
          onClick={bokfor}
          className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full bg-ink text-paper text-[12.5px] hover:bg-ink2"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
          Bokför
        </button>
      </div>
    </div>
  );
}
