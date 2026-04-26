"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { useCurrentClient } from "@/lib/store";
import { UploadDrawer } from "@/components/klient/UploadDrawer";
import { TxRow } from "@/components/klient/TxRow";

function LaddaUppInner() {
  const params = useSearchParams();
  const txId = params.get("txId");
  const client = useCurrentClient();
  const tx = txId ? client.transactions.find((t) => t.id === txId) : undefined;
  const missingTxs = client.transactions.filter((t) => t.status === "saknar_underlag");

  return (
    <div className="px-5">
      <header className="pt-5 pb-3 flex items-center gap-3">
        <Link
          href="/klient"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border hairline bg-paper2 hover:bg-paper3 focus-ring"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Link>
        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink3">Ladda upp</p>
          <h1 className="display text-[26px] leading-tight">
            {tx ? "Lägg till underlag" : "Vad gäller det?"}
          </h1>
        </div>
      </header>

      {tx ? (
        <UploadDrawer tx={tx} clientId={client.id} />
      ) : (
        <div className="space-y-4">
          {missingTxs.length === 0 ? (
            <div className="rounded-xl border hairline bg-green-soft/40 p-5">
              <p className="display text-[22px] text-green leading-tight">Inget saknas</p>
              <p className="text-[13px] text-ink2 mt-1">
                Allt är inskickat just nu. Du kan även ladda upp ett kvitto utan koppling till en transaktion.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[14px] text-ink2">
                Välj transaktion som saknar underlag, eller ladda upp fritt.
              </p>
              <div className="rounded-xl border hairline bg-paper2 overflow-hidden divide-y divide-line">
                {missingTxs.map((t) => (
                  <TxRow key={t.id} tx={t} />
                ))}
              </div>
            </>
          )}

          <details className="rounded-xl border hairline bg-paper2 px-4 py-3 [&_summary]:cursor-pointer">
            <summary className="text-[14px] text-ink">Ladda upp utan koppling</summary>
            <div className="pt-4">
              <UploadDrawer clientId={client.id} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default function LaddaUppPage() {
  return (
    <Suspense fallback={null}>
      <LaddaUppInner />
    </Suspense>
  );
}
