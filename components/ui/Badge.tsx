import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TxStatus } from "@/lib/types";

type Tone = "neutral" | "green" | "red" | "amber" | "ink";
type Size = "xs" | "sm";

const tones: Record<Tone, string> = {
  neutral: "bg-paper2 text-ink2 border-line",
  green: "bg-green-soft text-green border-green/15",
  red: "bg-red-soft text-red border-red/15",
  amber: "bg-amber-soft text-amber border-amber/15",
  ink: "bg-ink text-paper border-ink",
};

const sizes: Record<Size, string> = {
  xs: "text-[10px] tracking-[0.06em] px-1.5 py-0.5",
  sm: "text-[11px] tracking-[0.04em] px-2 py-0.5",
};

export function Badge({
  children,
  tone = "neutral",
  size = "sm",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const txTone: Record<TxStatus, Tone> = {
  saknar_underlag: "red",
  inkommen: "amber",
  bokford: "green",
  ok: "neutral",
};

export function StatusBadge({ status, size = "sm" }: { status: TxStatus; size?: Size }) {
  const labels: Record<TxStatus, string> = {
    saknar_underlag: "Saknar underlag",
    inkommen: "Inkommen",
    bokford: "Bokförd",
    ok: "Klar",
  };
  return (
    <Badge tone={txTone[status]} size={size}>
      {labels[status]}
    </Badge>
  );
}
