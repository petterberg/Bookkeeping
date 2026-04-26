"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Plug, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Status =
  | { state: "loading" }
  | { state: "connected"; companyName: string; orgNr?: string }
  | { state: "disconnected" }
  | { state: "error"; message: string };

export function FortnoxStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fortnox/company", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatus({ state: "error", message: data.error ?? "Okänt fel" });
          return;
        }
        if (data.connected) {
          setStatus({
            state: "connected",
            companyName: data.company?.Name ?? "Fortnox",
            orgNr: data.company?.OrganizationNumber,
          });
        } else {
          setStatus({ state: "disconnected" });
        }
      } catch (err) {
        if (!cancelled) setStatus({ state: "error", message: String(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function disconnect() {
    await fetch("/api/fortnox/disconnect", { method: "POST" });
    setStatus({ state: "disconnected" });
  }

  if (compact) {
    if (status.state === "connected") {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[11.5px] text-green"
          title={`Fortnox · ${status.companyName}`}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" />
          Fortnox
        </span>
      );
    }
    return null;
  }

  return (
    <div className="rounded-lg border hairline bg-paper2 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full",
              status.state === "connected"
                ? "bg-green-soft text-green"
                : status.state === "error"
                ? "bg-red-soft text-red"
                : "bg-paper border hairline text-ink3",
            )}
          >
            {status.state === "loading" ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.8} />
            ) : status.state === "connected" ? (
              <Check className="h-3 w-3" strokeWidth={2.4} />
            ) : status.state === "error" ? (
              <X className="h-3 w-3" strokeWidth={2.4} />
            ) : (
              <Plug className="h-3 w-3" strokeWidth={1.8} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink3 leading-tight">
              Fortnox
            </p>
            <p className="text-[12.5px] text-ink truncate leading-tight mt-0.5">
              {status.state === "connected"
                ? status.companyName
                : status.state === "loading"
                ? "Kontrollerar…"
                : status.state === "error"
                ? "Anslutningsfel"
                : "Ej ansluten"}
            </p>
          </div>
        </div>
        {status.state === "connected" ? (
          <button
            type="button"
            onClick={disconnect}
            className="text-[11px] text-ink3 hover:text-ink"
            title="Koppla från Fortnox"
          >
            koppla från
          </button>
        ) : status.state === "disconnected" || status.state === "error" ? (
          <a
            href="/api/fortnox/connect"
            className="inline-flex items-center gap-1 text-[11.5px] text-ink hover:underline"
          >
            Anslut →
          </a>
        ) : null}
      </div>
      {status.state === "connected" && status.orgNr ? (
        <p className="mono text-[10.5px] text-ink3 mt-1">{status.orgNr}</p>
      ) : null}
    </div>
  );
}
