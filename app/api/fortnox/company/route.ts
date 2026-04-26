import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/fortnox/company";
import { isConnected } from "@/lib/fortnox/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConnected()) {
    return NextResponse.json({ connected: false, source: "mock" as const });
  }

  try {
    const info = await getCompanyInfo();
    return NextResponse.json({ connected: true, company: info, source: "fortnox" as const });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        error: String((err as Error).message ?? err),
        source: "error" as const,
      },
      { status: 500 },
    );
  }
}
