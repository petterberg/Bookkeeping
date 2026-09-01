"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store";

export function ResetDemoButton() {
  const { resetDemo, toast, source } = useApp();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (source !== "supabase") return null;

  async function run() {
    setBusy(true);
    try {
      await resetDemo();
      toast("Demon återställd till utgångsläget", "success");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 text-[11.5px] text-ink3">
      {confirm ? (
        <>
          <span>Bekräfta återställning?</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="inline-flex items-center px-2 h-6 rounded-md hover:bg-paper2"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-ink text-paper hover:bg-ink2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Nollställ
            </button>
          </div>
        </>
      ) : (
        <>
          <span>Demo-data via Supabase</span>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex items-center gap-1 px-2 h-6 rounded-md hover:bg-paper2 hover:text-ink"
            title="Återställ demon till seed-data"
          >
            <RotateCcw className="h-3 w-3" />
            Nollställ
          </button>
        </>
      )}
    </div>
  );
}
