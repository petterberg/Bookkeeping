import { Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookkeepingSuggestion } from "@/lib/types";

export function SuggestionChip({
  suggestion,
  size = "md",
  className,
}: {
  suggestion: BookkeepingSuggestion;
  size?: "sm" | "md";
  className?: string;
}) {
  const fromHistory = suggestion.source.kind === "history";
  const Icon = fromHistory ? History : Sparkles;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border",
        fromHistory
          ? "bg-paper text-ink border-line"
          : "bg-paper2 text-ink2 border-line",
        size === "sm" ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]",
        className,
      )}
      title={
        fromHistory
          ? `Föreslås från denna klients historik (${suggestion.source.count}× tidigare)`
          : `Räknat från standardregel · ${suggestion.confidence}% konfidens`
      }
    >
      <Icon className="h-3 w-3 text-ink3" strokeWidth={1.7} />
      <span className="mono text-ink">{suggestion.posting.account}</span>
      <span className="text-ink2">{suggestion.posting.accountName}</span>
      <span className="text-ink3">·</span>
      <span className="text-ink2">{suggestion.posting.vatRate}%</span>
      {fromHistory && suggestion.source.count ? (
        <span className="ml-1 text-[10px] uppercase tracking-[0.06em] text-ink3">
          historik · {suggestion.source.count}×
        </span>
      ) : null}
    </span>
  );
}
