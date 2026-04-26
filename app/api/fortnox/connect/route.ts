import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAuthorizationUrl } from "@/lib/fortnox/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.FORTNOX_CLIENT_ID || !process.env.FORTNOX_CLIENT_SECRET || !process.env.FORTNOX_REDIRECT_URI) {
    return NextResponse.json(
      {
        error:
          "Fortnox är inte konfigurerat. Sätt FORTNOX_CLIENT_ID, FORTNOX_CLIENT_SECRET och FORTNOX_REDIRECT_URI i .env.local.",
      },
      { status: 500 },
    );
  }

  // CSRF-skydd: state-parametern krävs av Fortnox och bör i produktion
  // valideras i callback (spara i signerad cookie eller session).
  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = getAuthorizationUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("fortnox_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
