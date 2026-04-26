"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Paperclip, Image as ImageIcon, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatAmount, formatDate } from "@/lib/utils";
import type { ReceiptType, Transaction } from "@/lib/types";
import { useApp } from "@/lib/store";

const types: { value: ReceiptType; label: string; sub: string; icon: typeof Paperclip }[] = [
  { value: "privat", label: "Privatutlägg", sub: "Du betalade själv", icon: ImageIcon },
  { value: "foretagskort", label: "Företagskort", sub: "Dragit på företagskortet", icon: Paperclip },
  { value: "ovrigt", label: "Övrigt", sub: "Annat underlag", icon: FileText },
];

export function UploadDrawer({ tx, clientId }: { tx?: Transaction; clientId: string }) {
  const router = useRouter();
  const { dispatch, toast } = useApp();
  const [type, setType] = useState<ReceiptType | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File) {
    setSelectedFile(file);
    setFilename(file.name);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function submit() {
    if (!filename || !type || !tx) return;
    setSubmitting(true);

    type Source = "fortnox" | "mock" | "error";
    let fortnoxFileId: string | undefined;
    let source: Source = "mock";

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile, filename);
      } else {
        // Drag-drop kan ha tappat File-objektet om användaren ändrade input —
        // skicka bara metadata så routen returnerar mock-id.
        formData.append("filename", filename);
      }
      const res = await fetch("/api/fortnox/archive", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { fileId?: string; source?: Source };
      fortnoxFileId = data.fileId;
      source = data.source ?? "mock";
    } catch {
      source = "error";
    }

    dispatch({
      type: "update_tx",
      clientId,
      txId: tx.id,
      patch: {
        status: "inkommen",
        receiptType: type,
        note: note || undefined,
        receiptUrl: filename,
        fortnoxFileId,
      },
    });

    toast(
      source === "fortnox"
        ? "Skickat till revisorn · uppladdat i Fortnox Arkiv"
        : "Skickat till revisorn",
      "success",
    );
    setTimeout(() => router.push("/klient"), 250);
  }

  return (
    <div className="space-y-5">
      {tx ? (
        <div className="rounded-xl border hairline bg-paper2 p-4">
          <p className="text-[12px] uppercase tracking-[0.16em] text-ink3">Transaktion</p>
          <p className="text-[18px] mt-1">{tx.description}</p>
          <p className="mono text-[13px] text-ink3 mt-0.5">
            {formatDate(tx.date)} · {formatAmount(tx.amount, { sign: true })}
          </p>
        </div>
      ) : null}

      <label
        htmlFor="upload-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all px-5 py-10 text-center",
          dragOver
            ? "border-ink bg-paper3"
            : filename
            ? "border-green/40 bg-green-soft/40"
            : "border-line bg-paper2 hover:bg-paper3",
        )}
      >
        {filename ? (
          <>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green text-paper">
              <FileText className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <p className="text-[15px] text-ink">{filename}</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setFilename(null);
                setSelectedFile(null);
              }}
              className="inline-flex items-center gap-1 text-[12px] text-ink3 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" /> Ta bort
            </button>
          </>
        ) : (
          <>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper border hairline">
              <Paperclip className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="text-[16px] text-ink">Lägg till kvitto</p>
            <p className="text-[13px] text-ink3 max-w-[28ch]">
              Släpp en bild eller PDF här, eller välj från enheten
            </p>
          </>
        )}
        <input
          id="upload-file"
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
          }}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="soft"
          size="md"
          onClick={() => cameraRef.current?.click()}
          className="!justify-start"
        >
          <Camera className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Ta bild
        </Button>
        <Button
          type="button"
          variant="soft"
          size="md"
          onClick={() => inputRef.current?.click()}
          className="!justify-start"
        >
          <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Välj fil
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
          }}
        />
      </div>

      <div>
        <p className="text-[13px] text-ink3 mb-2">Betalningstyp</p>
        <div className="grid gap-2">
          {types.map((t) => {
            const Icon = t.icon;
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors focus-ring",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper2 hover:bg-paper3 text-ink",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full",
                    active ? "bg-paper/15 text-paper" : "bg-paper border hairline",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] leading-tight">{t.label}</span>
                  <span className={cn("block text-[12px]", active ? "text-paper/70" : "text-ink3")}>
                    {t.sub}
                  </span>
                </span>
                {active ? (
                  <span className="text-[11px] tracking-[0.06em] uppercase text-paper/80">vald</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="upload-note" className="text-[13px] text-ink3">
          Anteckning (valfritt)
        </label>
        <textarea
          id="upload-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="T.ex. lunch med kund, projektnamn, vem som var med…"
          className="mt-1.5 w-full rounded-xl border hairline bg-paper2 px-4 py-3 text-[14px] text-ink placeholder:text-ink4 focus-ring resize-none"
        />
      </div>

      <Button
        fullWidth
        size="lg"
        onClick={submit}
        disabled={!filename || !type || submitting || !tx}
      >
        {submitting ? "Skickar…" : "Skicka till revisorn"}
      </Button>
    </div>
  );
}
