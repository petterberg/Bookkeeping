"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Send, Save } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { cn, formatAmount, uid } from "@/lib/utils";
import type { Invoice, InvoiceLine, InvoiceStatus } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NyFakturaPage() {
  const client = useCurrentClient();
  const { dispatch, toast } = useApp();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerOrgNr, setCustomerOrgNr] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [issueDate, setIssueDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(plusDaysIso(30));
  const [note, setNote] = useState("");

  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: uid("il"), description: "", quantity: 1, unitPrice: 0, vatRate: 25 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function updateLine(id: string, patch: Partial<InvoiceLine>) {
    setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((cur) => [
      ...cur,
      { id: uid("il"), description: "", quantity: 1, unitPrice: 0, vatRate: 25 },
    ]);
  }
  function removeLine(id: string) {
    setLines((cur) => (cur.length === 1 ? cur : cur.filter((l) => l.id !== id)));
  }

  const totals = useMemo(() => {
    const net = lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
    const vat = lines.reduce(
      (a, l) => a + (l.quantity * l.unitPrice * l.vatRate) / 100,
      0,
    );
    return {
      net: Math.round(net),
      vat: Math.round(vat),
      total: Math.round(net + vat),
    };
  }, [lines]);

  const valid =
    customerName.trim().length > 0 &&
    lines.every((l) => l.description.trim().length > 0 && l.quantity > 0 && l.unitPrice > 0);

  function nextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const existing = client.invoices
      .map((i) => parseInt(i.number.split("-").pop() ?? "0", 10))
      .filter((n) => !Number.isNaN(n));
    const max = existing.length ? Math.max(...existing) : 100;
    return `${year}-${String(max + 1).padStart(4, "0")}`;
  }

  async function submit(asStatus: InvoiceStatus) {
    if (!valid && asStatus !== "utkast") return;
    setSubmitting(true);

    type Source = "fortnox" | "mock" | "error";
    let documentNumber: string | undefined;
    let source: Source = "mock";

    if (asStatus === "skickad") {
      try {
        const res = await fetch("/api/fortnox/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim() || undefined,
            customerOrgNr: customerOrgNr.trim() || undefined,
            lines,
            issueDate,
            dueDate,
            note: note.trim() || undefined,
          }),
        });
        const data = (await res.json()) as { documentNumber?: string; source?: Source };
        documentNumber = data.documentNumber;
        source = data.source ?? "mock";
      } catch {
        source = "error";
      }
    }

    const inv: Invoice = {
      id: uid("inv"),
      number: documentNumber ?? nextInvoiceNumber(),
      customerName: customerName.trim() || "Ej namngiven kund",
      customerOrgNr: customerOrgNr.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      issueDate,
      dueDate,
      lines,
      net: totals.net,
      vat: totals.vat,
      total: totals.total,
      status: asStatus,
      note: note.trim() || undefined,
      fortnoxSynced: source === "fortnox",
    };
    dispatch({ type: "add_invoice", clientId: client.id, invoice: inv });

    if (asStatus === "skickad") {
      toast(
        source === "fortnox"
          ? `Faktura ${inv.number} skapad och synkad med Fortnox`
          : `Faktura ${inv.number} skickad (demo-läge)`,
        "success",
      );
    } else {
      toast(`Faktura ${inv.number} sparad som utkast`, "success");
    }
    setTimeout(() => router.push("/klient/faktura"), 250);
  }

  return (
    <div className="px-5 pb-6">
      <header className="pt-5 pb-3 flex items-center gap-3">
        <Link
          href="/klient/faktura"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border hairline bg-paper2 hover:bg-paper3 focus-ring"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Link>
        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink3">Ny faktura</p>
          <h1 className="display text-[26px] leading-tight">Skapa underlag</h1>
        </div>
      </header>

      <div className="rounded-xl border hairline bg-paper2 p-4 space-y-3">
        <p className="text-[12px] uppercase tracking-[0.14em] text-ink3">Kund</p>
        <Field label="Namn / Företag">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="T.ex. Tenant Group AB"
            className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Org-/personnr">
            <input
              value={customerOrgNr}
              onChange={(e) => setCustomerOrgNr(e.target.value)}
              placeholder="556xxx-xxxx"
              className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring mono"
            />
          </Field>
          <Field label="E-post">
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="ekonomi@kund.se"
              className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border hairline bg-paper2 p-4 mt-3 space-y-3">
        <p className="text-[12px] uppercase tracking-[0.14em] text-ink3">Datum</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Fakturadatum">
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring mono"
            />
          </Field>
          <Field label="Förfallodatum">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring mono"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border hairline bg-paper2 p-4 mt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] uppercase tracking-[0.14em] text-ink3">Rader</p>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 text-[13px] text-ink hover:underline"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Lägg till rad
          </button>
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={l.id} className="rounded-lg bg-paper border hairline p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-ink3 mono">Rad {i + 1}</span>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(l.id)}
                    className="inline-flex items-center gap-1 text-[11.5px] text-ink3 hover:text-red"
                    aria-label="Ta bort rad"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.7} /> Ta bort
                  </button>
                ) : null}
              </div>
              <input
                value={l.description}
                onChange={(e) => updateLine(l.id, { description: e.target.value })}
                placeholder="Beskrivning"
                className="w-full rounded-lg border hairline bg-paper2 px-3 py-2 text-[14px] focus-ring"
              />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Antal">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={l.quantity}
                    onChange={(e) =>
                      updateLine(l.id, { quantity: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border hairline bg-paper2 px-3 py-2 text-[14px] focus-ring mono"
                  />
                </Field>
                <Field label="À-pris">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={l.unitPrice}
                    onChange={(e) =>
                      updateLine(l.id, { unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border hairline bg-paper2 px-3 py-2 text-[14px] focus-ring mono"
                  />
                </Field>
                <Field label="Moms">
                  <select
                    value={l.vatRate}
                    onChange={(e) =>
                      updateLine(l.id, { vatRate: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border hairline bg-paper2 px-3 py-2 text-[14px] focus-ring"
                  >
                    <option value={25}>25 %</option>
                    <option value={12}>12 %</option>
                    <option value={6}>6 %</option>
                    <option value={0}>0 %</option>
                  </select>
                </Field>
              </div>
              <p className="text-[11.5px] text-ink3 mono text-right">
                Radsumma: {formatAmount(l.quantity * l.unitPrice)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border hairline bg-paper2 p-4 mt-3">
        <p className="text-[12px] uppercase tracking-[0.14em] text-ink3 mb-2">Anteckning</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Visas på fakturan, t.ex. projekt eller referens"
          className="w-full rounded-lg border hairline bg-paper px-3 py-2 text-[14px] focus-ring resize-none"
        />
      </div>

      <div className="rounded-xl bg-ink text-paper p-4 mt-3">
        <Row label="Netto" value={formatAmount(totals.net)} />
        <Row label="Moms" value={formatAmount(totals.vat)} />
        <div className="border-t border-paper/15 mt-2 pt-2">
          <Row label="Att betala" value={formatAmount(totals.total)} bold />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button
          variant="soft"
          size="lg"
          onClick={() => submit("utkast")}
          disabled={submitting || customerName.trim().length === 0}
        >
          <Save className="h-4 w-4" strokeWidth={1.7} />
          Spara utkast
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => submit("skickad")}
          disabled={!valid || submitting}
        >
          <Send className="h-4 w-4" strokeWidth={1.7} />
          Skicka faktura
        </Button>
      </div>
      <p className={cn("text-[11.5px] mt-2 text-center", valid ? "text-ink3" : "text-amber")}>
        {valid
          ? "Klart att skicka. Klienten får mejl och betalar enligt förfallodatum."
          : "Fyll i kund, beskrivning, antal och à-pris för alla rader för att kunna skicka."}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] text-ink3 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className={cn(bold ? "text-paper" : "text-paper/70")}>{label}</span>
      <span className={cn("mono", bold ? "text-paper text-[18px]" : "text-paper/90")}>
        {value}
      </span>
    </div>
  );
}
