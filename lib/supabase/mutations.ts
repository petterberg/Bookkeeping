import { supabaseAdmin } from "./client";
import type {
  BookkeepingPosting,
  Invoice,
  Message,
  ReceiptType,
  SalaryRequest,
  SalaryStatus,
  Transaction,
  TxStatus,
} from "@/lib/types";
import { patternFromDescription } from "@/lib/bookkeeping-rules";
import { fromInvoice, fromMessage, fromSalary, fromTransaction } from "./mappers";
import type { Match } from "@/lib/csv";
import { uid } from "@/lib/utils";

// ─── update_tx ────────────────────────────────────────────────────
export async function updateTx(
  clientId: string,
  txId: string,
  patch: {
    status?: TxStatus;
    receiptType?: ReceiptType;
    note?: string;
    receiptUrl?: string;
    posting?: BookkeepingPosting;
    orphanId?: string;
    fortnoxFileId?: string;
  },
): Promise<void> {
  const db = supabaseAdmin();
  const dbPatch: Record<string, unknown> = {};
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.receiptType !== undefined) dbPatch.receipt_type = patch.receiptType;
  if (patch.note !== undefined) dbPatch.note = patch.note;
  if (patch.receiptUrl !== undefined) dbPatch.receipt_url = patch.receiptUrl;
  if (patch.posting !== undefined) dbPatch.posting = patch.posting;
  if (patch.orphanId !== undefined) dbPatch.orphan_id = patch.orphanId;
  if (patch.fortnoxFileId !== undefined) dbPatch.fortnox_file_id = patch.fortnoxFileId;

  const { error } = await db.from("transactions").update(dbPatch).eq("id", txId);
  if (error) throw error;
  await touchClient(clientId);
}

// ─── bokfor (with learned rule upsert) ────────────────────────────
export async function bokfor(
  clientId: string,
  txId: string,
  posting: BookkeepingPosting,
): Promise<void> {
  const db = supabaseAdmin();

  const { data: txRow, error: readErr } = await db
    .from("transactions")
    .select("description")
    .eq("id", txId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!txRow) throw new Error("Transaktion saknas");

  const { error: upErr } = await db
    .from("transactions")
    .update({ status: "bokford" as TxStatus, posting })
    .eq("id", txId);
  if (upErr) throw upErr;

  const pattern = patternFromDescription(txRow.description as string);
  const today = new Date().toISOString().slice(0, 10);

  // Upsert learned rule (client_id + pattern is unique)
  const { data: existing } = await db
    .from("learned_rules")
    .select("id, count")
    .eq("client_id", clientId)
    .eq("pattern", pattern)
    .maybeSingle();

  if (existing) {
    await db
      .from("learned_rules")
      .update({
        posting,
        count: (existing.count as number) + 1,
        last_used: today,
      })
      .eq("id", existing.id);
  } else {
    await db.from("learned_rules").insert({
      id: uid("lr"),
      client_id: clientId,
      pattern,
      posting,
      count: 1,
      last_used: today,
    });
  }

  await touchClient(clientId);
}

// ─── add_message ──────────────────────────────────────────────────
export async function addMessage(clientId: string, message: Message): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("messages").insert(fromMessage(message, clientId));
  if (error) throw error;
  await touchClient(clientId);
}

// ─── mark_messages_read ───────────────────────────────────────────
export async function markMessagesRead(clientId: string, reader: "klient" | "revisor"): Promise<void> {
  const otherRole = reader === "klient" ? "revisor" : "klient";
  const db = supabaseAdmin();
  const { error } = await db
    .from("messages")
    .update({ read: true })
    .eq("client_id", clientId)
    .eq("from_role", otherRole)
    .eq("read", false);
  if (error) throw error;
}

// ─── import_csv ───────────────────────────────────────────────────
export async function importCsv(clientId: string, matches: Match[]): Promise<void> {
  const db = supabaseAdmin();
  const newTx: Transaction[] = matches.map((m) => {
    const status: TxStatus =
      m.row.amount > 0
        ? "ok"
        : m.orphan
        ? "inkommen"
        : "saknar_underlag";
    const t: Transaction = {
      id: uid("ti"),
      date: m.row.date,
      description: m.row.description,
      amount: m.row.amount,
      status,
    };
    if (m.orphan) {
      t.receiptType = m.orphan.receiptType;
      t.note = m.orphan.note;
      t.receiptUrl = m.orphan.filename;
      t.orphanId = m.orphan.id;
    }
    return t;
  });

  const consumedOrphanIds = matches
    .map((m) => m.orphan?.id)
    .filter((x): x is string => Boolean(x));

  const { error: insErr } = await db
    .from("transactions")
    .insert(newTx.map((t) => fromTransaction(t, clientId)));
  if (insErr) throw insErr;

  if (consumedOrphanIds.length) {
    const { error: delErr } = await db
      .from("orphans")
      .delete()
      .in("id", consumedOrphanIds);
    if (delErr) throw delErr;
  }

  await touchClient(clientId);
}

// ─── add_invoice ──────────────────────────────────────────────────
export async function addInvoice(clientId: string, invoice: Invoice): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("invoices").insert(fromInvoice(invoice, clientId));
  if (error) throw error;
  await touchClient(clientId);
}

// ─── add_salary_request ───────────────────────────────────────────
export async function addSalaryRequest(clientId: string, request: SalaryRequest): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("salary_requests").insert(fromSalary(request, clientId));
  if (error) throw error;
  await touchClient(clientId);
}

// ─── update_salary_status ─────────────────────────────────────────
export async function updateSalaryStatus(
  clientId: string,
  requestId: string,
  status: SalaryStatus,
  decisionNote?: string,
): Promise<void> {
  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const patch: Record<string, unknown> = { status };
  if (status === "godkand" || status === "avvisad") patch.decided_at = now;
  if (status === "utbetald") patch.paid_at = today;
  if (decisionNote !== undefined) patch.decision_note = decisionNote;

  const { error } = await db.from("salary_requests").update(patch).eq("id", requestId);
  if (error) throw error;
  await touchClient(clientId);
}

// ─── helper: bump last_active on any mutation ─────────────────────
async function touchClient(clientId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await supabaseAdmin().from("clients").update({ last_active: today }).eq("id", clientId);
}
