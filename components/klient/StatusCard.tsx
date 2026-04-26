"use client";

import Link from "next/link";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  missing: number;
  inkomna: number;
  bokforda: number;
  period?: string;
};

export function StatusCard({ missing, inkomna, bokforda, period = "mars 2026" }: Props) {
  const allClear = missing === 0;
  return (
    <Link
      href="/klient/ladda-upp"
      className={cn(
        "block rounded-xl p-5 border transition-colors focus-ring",
        allClear
          ? "bg-green-soft border-green/15 text-green hover:opacity-95"
          : "bg-red-soft border-red/15 text-red hover:opacity-95",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] opacity-80">{period}</p>
          <h2 className="display text-[40px] leading-[1] mt-1.5">
            {allClear ? "Allt är klart" : `${missing} saknar underlag`}
          </h2>
          <p className="text-sm mt-2 opacity-90 max-w-[28ch]">
            {allClear
              ? "Inget kräver din åtgärd just nu. Anna hör av sig om något dyker upp."
              : "Klicka för att ladda upp dina kvitton så stänger vi månaden i tid."}
          </p>
        </div>
        <span className="opacity-80 -mr-1 mt-0.5">
          {allClear ? (
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.6} />
          ) : (
            <AlertCircle className="h-5 w-5" strokeWidth={1.6} />
          )}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-5 text-[13px]">
          <span>
            <span className="mono text-ink/0">·</span>
            <span className="opacity-75">Inkomna</span>{" "}
            <span className="mono">{inkomna}</span>
          </span>
          <span>
            <span className="opacity-75">Bokförda</span>{" "}
            <span className="mono">{bokforda}</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm">
          {allClear ? "Översikt" : "Åtgärda"} <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
        </span>
      </div>
    </Link>
  );
}
