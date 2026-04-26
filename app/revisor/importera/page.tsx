"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileText,
  Sparkles,
  Upload as UploadIcon,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Topbar } from "@/components/revisor/Sidebar";
import { Button } from "@/components/ui/Button";
import { SuggestionChip } from "@/components/revisor/SuggestionChip";
import { matchOrphans, parseCsv, type Match } from "@/lib/csv";
import { suggest } from "@/lib/bookkeeping-rules";
import { cn, formatAmount, formatDate } from "@/lib/utils";

export default function ImporteraPage() {
  const { state, dispatch, toast } = useApp();
  const router = useRouter();

  const [clientId, setClientId] = useState<string>(state.revisor.clients[0]?.id ?? "");
  const client = state.revisor.clients.find((c) => c.id === clientId);
  const [csvText, setCsvText] = useState<string>("");
  const [stage, setStage] = useState<"input" | "preview">("input");

  const parsed = useMemo(() => parseCsv(csvText || ""), [csvText]);
  const matches: Match[] = useMemo(() => {
    if (!client) return [];
    return matchOrphans(parsed.rows, client.orphans);
  }, [parsed.rows, client]);

  const matchedCount = matches.filter((m) => m.orphan).length;
  const missingCount = matches.filter((m) => !m.orphan && m.row.amount < 0).length;
  const incomeCount = matches.filter((m) => m.row.amount > 0).length;

  function loadSample() {
    if (client?.sampleCsv) setCsvText(client.sampleCsv);
  }

  function analysera() {
    if (parsed.rows.length === 0) return;
    setStage("preview");
  }

  function importera() {
    if (!client) return;
    dispatch({ type: "import_csv", clientId: client.id, matches });
    toast(
      `Importerade ${parsed.rows.length} transaktioner · ${matchedCount} matchade underlag`,
      "success",
    );
    router.push(`/revisor/klient/${client.id}`);
  }

  return (
    <>
      <Topbar
        subtitle="Bankimport"
        title="Importera kontoutdrag"
        meta={
          stage === "input"
            ? "Ladda upp eller klistra in en CSV-fil från banken — Räkna matchar mot uppladdade underlag och föreslår bokföring."
            : `${parsed.rows.length} rader · ${matchedCount} matchade · ${missingCount} saknar underlag · ${incomeCount} intäkter`
        }
      />

      <div className="px-4 lg:px-8 xl:px-10 py-6 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <aside className="space-y-4">
            <div className="rounded-xl border hairline bg-paper p-5">
              <p className="text-[12px] uppercase tracking-[0.14em] text-ink3 mb-2">Klient</p>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setCsvText("");
                  setStage("input");
                }}
                className="w-full rounded-lg border hairline bg-paper2 px-3 py-2 text-[14px] focus-ring"
              >
                {state.revisor.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {client ? (
                <div className="mt-4 space-y-2 text-[13px]">
                  <Row label="Bank" value={client.bank} />
                  <Row label="Period" value="april 2026" />
                  <Row
                    label="Uppladdade underlag"
                    value={
                      client.orphans.length > 0
                        ? `${client.orphans.length} st väntar`
                        : "Inga väntande"
                    }
                  />
                  <Row label="Lärda regler" value={`${client.learnedRules.length} st`} />
                </div>
              ) : null}
              {client?.sampleCsv ? (
                <button
                  type="button"
                  onClick={loadSample}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-paper2 hover:bg-paper3 border hairline h-9 text-[12.5px]"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} />
                  Använd exempel-kontoutdrag
                </button>
              ) : null}
            </div>

            {client && client.orphans.length > 0 ? (
              <div className="rounded-xl border hairline bg-paper p-5">
                <p className="text-[12px] uppercase tracking-[0.14em] text-ink3 mb-3">
                  Inkomna underlag (väntar på match)
                </p>
                <ul className="space-y-2.5">
                  {client.orphans.map((o) => (
                    <li key={o.id} className="flex items-start gap-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper2 border hairline">
                        <FileText className="h-3.5 w-3.5 text-ink2" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] truncate">{o.ocrMotpart}</p>
                        <p className="mono text-[11.5px] text-ink3">
                          {formatDate(o.ocrDate)} · {formatAmount(o.ocrAmount)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>

          <div className="space-y-4">
            {stage === "input" ? (
              <>
                <div className="rounded-xl border hairline bg-paper p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] uppercase tracking-[0.14em] text-ink3">
                      CSV från banken
                    </p>
                    <span className="text-[12px] text-ink3">
                      Format: <span className="mono">Datum;Beskrivning;Belopp</span>
                    </span>
                  </div>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={14}
                    spellCheck={false}
                    placeholder={`Datum;Beskrivning;Belopp\n2026-04-22;Microsoft 365;-1490\n2026-04-18;Restaurang Pelikan;-2850\n…`}
                    className="w-full mono text-[12.5px] rounded-lg border hairline bg-paper2 px-3 py-3 focus-ring resize-y leading-relaxed"
                  />
                  {parsed.errors.length > 0 ? (
                    <div className="mt-3 rounded-lg bg-red-soft border border-red/15 text-red px-3 py-2 text-[12.5px]">
                      <p className="font-medium mb-1 inline-flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.7} />
                        {parsed.errors.length} rader kunde inte tolkas
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {parsed.errors.slice(0, 3).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[12.5px] text-ink3">
                      {parsed.rows.length > 0
                        ? `${parsed.rows.length} giltiga rader`
                        : "Klistra in eller välj exempel"}
                    </p>
                    <Button
                      onClick={analysera}
                      disabled={parsed.rows.length === 0}
                      size="md"
                    >
                      <UploadIcon className="h-4 w-4" strokeWidth={1.7} />
                      Analysera matchningar
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border hairline bg-paper2 p-4 text-[12.5px] text-ink2 leading-relaxed">
                  <p className="font-medium text-ink mb-1">Så här tänker Räkna:</p>
                  Varje bankrad jämförs med klientens uppladdade underlag på datum (±3 dagar)
                  och exakt belopp. Match → underlaget knyts till transaktionen automatiskt.
                  Ingen match på utgift → markeras som <span className="text-red">saknar underlag</span>.
                  Intäkter passerar oförändrat. Bokföringsförslagen kommer från standardregler
                  och klientens egen historik.
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border hairline bg-paper overflow-hidden">
                  <div className="grid grid-cols-[80px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-ink3 border-b hairline bg-paper2/40">
                    <div>Datum</div>
                    <div>Beskrivning</div>
                    <div>Belopp</div>
                    <div>Match · förslag</div>
                    <div className="text-right">Status</div>
                  </div>
                  <div className="divide-y divide-line">
                    {matches.map((m, i) => (
                      <PreviewRow key={i} match={m} clientId={clientId} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStage("input")}
                    className="inline-flex items-center gap-1.5 text-[13px] text-ink2 hover:text-ink"
                  >
                    ← Justera CSV
                  </button>
                  <Button onClick={importera} size="lg">
                    Importera {parsed.rows.length} transaktioner
                    <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink3">{label}</span>
      <span className="text-ink2">{value}</span>
    </div>
  );
}

function PreviewRow({ match, clientId }: { match: Match; clientId: string }) {
  const { state } = useApp();
  const client = state.revisor.clients.find((c) => c.id === clientId);
  const sug = suggest(match.row.description, match.row.amount, client?.learnedRules ?? []);

  const statusTone =
    match.orphan
      ? "text-green"
      : match.row.amount > 0
      ? "text-ink3"
      : "text-red";
  const StatusIcon =
    match.orphan ? CheckCircle2 : match.row.amount > 0 ? CircleDashed : AlertCircle;
  const statusLabel =
    match.orphan
      ? "Underlag matchat"
      : match.row.amount > 0
      ? "Intäkt"
      : "Saknar underlag";

  return (
    <div className="grid grid-cols-[80px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 items-center px-5 py-3.5 hover:bg-paper2 transition-colors">
      <div className="mono text-[12.5px] text-ink3">{formatDate(match.row.date)}</div>
      <div className="min-w-0">
        <p className="text-[14px] truncate">{match.row.description}</p>
        {match.orphan ? (
          <p className="text-[11.5px] text-ink3 truncate">
            ↳ {match.orphan.filename}
            {match.matchReason ? ` · ${match.matchReason}` : ""}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          "mono text-[14px] tabular-nums",
          match.row.amount > 0 ? "text-green" : "text-ink",
        )}
      >
        {formatAmount(match.row.amount, { sign: true })}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {sug ? (
          <SuggestionChip suggestion={sug} size="sm" />
        ) : (
          <span className="text-[12px] text-ink3">Inget förslag</span>
        )}
      </div>
      <div className={cn("flex items-center gap-1.5 text-[12.5px] justify-end", statusTone)}>
        <StatusIcon className="h-3.5 w-3.5" strokeWidth={1.7} />
        {statusLabel}
      </div>
    </div>
  );
}
