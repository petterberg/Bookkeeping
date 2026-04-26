import { NextRequest, NextResponse } from "next/server";
import { getVouchers, summarizeVouchers } from "@/lib/fortnox/vouchers";
import { isConnected } from "@/lib/fortnox/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fromDate = url.searchParams.get("from") ?? defaultFrom();
  const toDate = url.searchParams.get("to") ?? defaultTo();

  if (!isConnected()) {
    return NextResponse.json({
      vouchers: [],
      summary: { intakter: 0, kostnader: 0, resultat: 0, moms: 0, kassaflode: 0 },
      source: "mock" as const,
      message: "Fortnox ej anslutet — använder mock-data i UI:t.",
    });
  }

  try {
    const vouchers = await getVouchers(fromDate, toDate);
    return NextResponse.json({
      vouchers,
      summary: summarizeVouchers(vouchers),
      source: "fortnox" as const,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err), source: "error" as const },
      { status: 500 },
    );
  }
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 5);
  return d.toISOString().slice(0, 10);
}
function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}
