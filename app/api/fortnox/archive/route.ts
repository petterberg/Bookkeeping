import { NextRequest, NextResponse } from "next/server";
import { uploadToArchive } from "@/lib/fortnox/archive";
import { isConnected } from "@/lib/fortnox/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isConnected()) {
    // Demo-läge: simulera uppladdning med liten fördröjning
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ fileId: "demo-" + Date.now().toString(36), source: "mock" as const });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Ingen fil uppladdad" }, { status: 400 });
  }

  try {
    const fileId = await uploadToArchive(file, file.name);
    return NextResponse.json({ fileId, source: "fortnox" as const });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err), source: "error" as const },
      { status: 500 },
    );
  }
}
