"use client";

import { Check, Paperclip, Image as ImageIcon, FileText, Send } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { useApp } from "@/lib/store";
import { cn, formatAmount, formatDate, receiptTypeLabel, uid } from "@/lib/utils";
import { suggest } from "@/lib/bookkeeping-rules";
import type { Transaction, LearnedRule } from "@/lib/types";
import { SuggestionChip } from "@/components/revisor/SuggestionChip";

export function TxRowDesktop({
  tx,
  clientId,
  learnedRules,
}: {
  tx: Transaction;
  clientId: string;
  learnedRules: LearnedRule[];
}) {
  const { dispatch, toast } = useApp();
  const isIncome = tx.amount > 0;
  const sug = !tx.posting && tx.status !== "ok"
    ? suggest(tx.description, tx.amount, learnedRules)
    : null;

  function bokfor() {
    if (sug) {
      dispatch({ type: "bokfor", clientId, txId: tx.id, posting: sug.posting });
      toast(
        `Bokförd · ${sug.posting.account} ${sug.posting.accountName} · ${sug.posting.vatRate}%`,
        "success",
      );
    } else {
      dispatch({
        type: "update_tx",
        clientId,
        txId: tx.id,
        patch: { status: "bokford" },
      });
      toast(`Bokförd · ${tx.description}`, "success");
    }
  }

  function begar() {
    dispatch({
      type: "add_message",
      clientId,
      message: {
        id: uid("m"),
        from: "revisor",
        text: `Hej! Vi saknar underlag för ${tx.description} (${formatAmount(tx.amount)}, ${formatDate(tx.date)}). Kan du ladda upp det?`,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
    toast("Begäran skickad till klienten");
  }

  const TypeIcon =
    tx.receiptType === "privat"
      ? ImageIcon
      : tx.receiptType === "ovrigt"
      ? FileText
      : tx.receiptType === "foretagskort"
      ? Paperclip
      : null;

  return (
    <div className="grid grid-cols-[88px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 items-center px-5 py-3.5 hover:bg-paper2 transition-colors">
      <div className="mono text-[12.5px] text-ink3">{formatDate(tx.date)}</div>

      <div className="min-w-0">
        <p className="text-[14.5px] truncate">{tx.description}</p>
        {tx.note ? (
          <p className="text-[12px] text-ink3 truncate">{tx.note}</p>
        ) : null}
      </div>

      <div className={cn("mono text-[14.5px] tabular-nums", isIncome ? "text-green" : "text-ink")}>
        {formatAmount(tx.amount, { sign: true })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={tx.status} />
        {TypeIcon && tx.receiptType ? (
          <Badge tone="neutral" size="sm">
            <TypeIcon className="h-3 w-3" strokeWidth={1.7} />
            {receiptTypeLabel[tx.receiptType]}
          </Badge>
        ) : null}
        {tx.posting ? (
          <Badge tone="neutral" size="sm">
            <span className="mono">{tx.posting.account}</span>
            <span className="opacity-80">{tx.posting.accountName}</span>
            <span className="opacity-60">· {tx.posting.vatRate}%</span>
          </Badge>
        ) : sug ? (
          <SuggestionChip suggestion={sug} size="sm" />
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 justify-end">
        {tx.status === "saknar_underlag" ? (
          <button
            type="button"
            onClick={begar}
            className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full text-[12.5px] bg-paper2 hover:bg-paper3 border hairline"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.7} />
            Begär underlag
          </button>
        ) : null}
        {tx.status === "inkommen" ? (
          <button
            type="button"
            onClick={bokfor}
            className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full text-[12.5px] bg-ink text-paper hover:bg-ink2"
            title={
              sug
                ? `Bokför enligt ${sug.source.kind === "history" ? "klientens historik" : "standardregel"}: ${sug.posting.account} ${sug.posting.accountName}`
                : "Bokför utan kontoförslag"
            }
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            {sug ? "Bokför enligt förslag" : "Bokför"}
          </button>
        ) : null}
        {tx.status === "bokford" || tx.status === "ok" ? (
          <span className="inline-flex h-8 items-center gap-1.5 px-3 text-[12.5px] text-ink3">
            —
          </span>
        ) : null}
      </div>
    </div>
  );
}
