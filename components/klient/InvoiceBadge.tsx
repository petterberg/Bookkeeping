import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";

const tones: Record<InvoiceStatus, string> = {
  utkast: "bg-paper3 text-ink2 border-line",
  skickad: "bg-paper2 text-ink border-line",
  betald: "bg-green-soft text-green border-green/15",
  forfallen: "bg-red-soft text-red border-red/15",
};

const labels: Record<InvoiceStatus, string> = {
  utkast: "Utkast",
  skickad: "Skickad",
  betald: "Betald",
  forfallen: "Förfallen",
};

export function InvoiceBadge({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
