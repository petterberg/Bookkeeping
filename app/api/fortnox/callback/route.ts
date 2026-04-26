import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/fortnox/auth";
import { saveTokens } from "@/lib/fortnox/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const expectedState = request.cookies.get("fortnox_oauth_state")?.value;

  const origin = url.origin;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?fortnox=error&reason=${encodeURIComponent(error ?? "no_code")}`);
  }
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?fortnox=error&reason=state_mismatch`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    saveTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
    const response = NextResponse.redirect(`${origin}/revisor?fortnox=connected`);
    response.cookies.delete("fortnox_oauth_state");
    return response;
  } catch (err) {
    console.error("Fortnox token exchange failed:", err);
    return NextResponse.redirect(`${origin}/?fortnox=error&reason=token_exchange`);
  }
}
