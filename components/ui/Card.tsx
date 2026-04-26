import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "ink" | "paper" | "alert";
}) {
  const tones = {
    default: "bg-paper2 border hairline",
    paper: "bg-paper border hairline",
    ink: "bg-ink text-paper border-ink",
    alert: "bg-red-soft border border-red/15 text-red",
  } as const;
  return (
    <div className={cn("rounded-xl", tones[tone], className)}>{children}</div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}
