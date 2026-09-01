import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadState, seedDemoData } from "@/lib/supabase/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/data/reset — rensar demo-workspacet och seedar om från mock-datan.
// Bara att köra före byrå-demos.
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase ej konfigurerat. Sätt NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }
  try {
    await seedDemoData();
    const state = await loadState();
    return NextResponse.json({ ok: true, ...state, source: "supabase" as const });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err) },
      { status: 500 },
    );
  }
}
