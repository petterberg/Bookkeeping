import { NextRequest, NextResponse } from "next/server";
import {
  createInvoice,
  getInvoices,
  mapFortnoxInvoice,
} from "@/lib/fortnox/invoices";
import { isConnected } from "@/lib/fortnox/client";
import { REVISOR, CURRENT_CLIENT_ID } from "@/lib/mock-data";
import type { InvoiceLine } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const currentClient = () =>
  REVISOR.clients.find((c) => c.id === CURRENT_CLIENT_ID) ?? REVISOR.clients[0];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? undefined;

  if (!isConnected()) {
    return NextResponse.json({
      invoices: currentClient().invoices,
      source: "mock" as const,
    });
  }

  try {
    const fortnoxInvoices = await getInvoices(filter);
    return NextResponse.json({
      invoices: fortnoxInvoices.map(mapFortnoxInvoice),
      source: "fortnox" as const,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err), source: "error" as const },
      { status: 500 },
    );
  }
}

interface CreateInvoiceBody {
  customerName: string;
  customerEmail?: string;
  customerOrgNr?: string;
  lines: InvoiceLine[];
  dueDate: string;
  issueDate?: string;
  termsOfPayment?: number;
  note?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateInvoiceBody;

  if (!isConnected()) {
    // Demo-läge: simulera Fortnox-svar
    return NextResponse.json({
      documentNumber: "DEMO-" + Date.now().toString().slice(-6),
      source: "mock" as const,
    });
  }

  try {
    const documentNumber = await createInvoice(body);
    return NextResponse.json({ documentNumber, source: "fortnox" as const });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err), source: "error" as const },
      { status: 500 },
    );
  }
}
