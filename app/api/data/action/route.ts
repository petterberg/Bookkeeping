import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadState } from "@/lib/supabase/queries";
import {
  addInvoice,
  addMessage,
  addSalaryRequest,
  bokfor,
  importCsv,
  markMessagesRead,
  updateSalaryStatus,
  updateTx,
} from "@/lib/supabase/mutations";
import type {
  BookkeepingPosting,
  Invoice,
  Message,
  ReceiptType,
  Role,
  SalaryRequest,
  SalaryStatus,
  TxStatus,
} from "@/lib/types";
import type { Match } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | {
      type: "update_tx";
      clientId: string;
      txId: string;
      patch: {
        status?: TxStatus;
        receiptType?: ReceiptType;
        note?: string;
        receiptUrl?: string;
        posting?: BookkeepingPosting;
        orphanId?: string;
        fortnoxFileId?: string;
      };
    }
  | { type: "bokfor"; clientId: string; txId: string; posting: BookkeepingPosting }
  | { type: "add_message"; clientId: string; message: Message }
  | { type: "mark_messages_read"; clientId: string; reader: Role }
  | { type: "import_csv"; clientId: string; matches: Match[] }
  | { type: "add_invoice"; clientId: string; invoice: Invoice }
  | { type: "add_salary_request"; clientId: string; request: SalaryRequest }
  | {
      type: "update_salary_status";
      clientId: string;
      requestId: string;
      status: SalaryStatus;
      decisionNote?: string;
    };

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase ej konfigurerat.", source: "mock" as const },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  try {
    switch (body.type) {
      case "update_tx":
        await updateTx(body.clientId, body.txId, body.patch);
        break;
      case "bokfor":
        await bokfor(body.clientId, body.txId, body.posting);
        break;
      case "add_message":
        await addMessage(body.clientId, body.message);
        break;
      case "mark_messages_read":
        await markMessagesRead(body.clientId, body.reader);
        break;
      case "import_csv":
        await importCsv(body.clientId, body.matches);
        break;
      case "add_invoice":
        await addInvoice(body.clientId, body.invoice);
        break;
      case "add_salary_request":
        await addSalaryRequest(body.clientId, body.request);
        break;
      case "update_salary_status":
        await updateSalaryStatus(
          body.clientId,
          body.requestId,
          body.status,
          body.decisionNote,
        );
        break;
      default:
        return NextResponse.json({ error: "Okänd action" }, { status: 400 });
    }
    const state = await loadState();
    return NextResponse.json({ ok: true, ...state, source: "supabase" as const });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err), source: "error" as const },
      { status: 500 },
    );
  }
}
