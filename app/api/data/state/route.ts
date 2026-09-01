import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadState, seedDemoData } from "@/lib/supabase/queries";
import { REVISOR } from "@/lib/mock-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Fallback så demon fungerar innan env-vars är satta i Vercel.
    return NextResponse.json({ revisor: REVISOR, source: "mock" as const });
  }
  try {
    let state = await loadState();
    if (!state) {
      // Först gången — auto-seed.
      await seedDemoData();
      state = await loadState();
    }
    return NextResponse.json({ ...state, source: "supabase" as const });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err), source: "error" as const },
      { status: 500 },
    );
  }
}
