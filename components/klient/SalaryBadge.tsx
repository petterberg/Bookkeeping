import { cn } from "@/lib/utils";
import type { SalaryStatus } from "@/lib/types";

const tones: Record<SalaryStatus, string> = {
  begart: "bg-amber-soft text-amber border-amber/15",
  godkand: "bg-paper2 text-ink border-line",
  utbetald: "bg-green-soft text-green border-green/15",
  avvisad: "bg-red-soft text-red border-red/15",
};

const labels: Record<SalaryStatus, string> = {
  begart: "Inväntar revisor",
  godkand: "Godkänd",
  utbetald: "Utbetald",
  avvisad: "Avvisad",
};

export function SalaryBadge({
  status,
  className,
}: {
  status: SalaryStatus;
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
