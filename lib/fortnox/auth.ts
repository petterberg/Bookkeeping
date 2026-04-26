// Fortnox OAuth 2.0 (Authorization Code).
// Docs: https://developer.fortnox.se/general/authentication/

const FORTNOX_AUTH_URL = "https://apps.fortnox.se/oauth-v1/auth";
const FORTNOX_TOKEN_URL = "https://apps.fortnox.se/oauth-v1/token";

export const FORTNOX_SCOPES = [
  "companyinformation",
  "customer",
  "article",
  "invoice",
  "bookkeeping",
  "archive",
  "connectfile",
].join(" ");

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FORTNOX_CLIENT_ID!,
    redirect_uri: process.env.FORTNOX_REDIRECT_URI!,
    scope: FORTNOX_SCOPES,
    state,
    access_type: "offline", // krävs för refresh_token
    response_type: "code",
  });
  return `${FORTNOX_AUTH_URL}?${params.toString()}`;
}

export type FortnoxTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

function basicAuthHeader(): string {
  const id = process.env.FORTNOX_CLIENT_ID;
  const secret = process.env.FORTNOX_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("FORTNOX_CLIENT_ID/FORTNOX_CLIENT_SECRET saknas i miljövariabler");
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

export async function exchangeCodeForTokens(code: string): Promise<FortnoxTokenResponse> {
  const response = await fetch(FORTNOX_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.FORTNOX_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${error}`);
  }
  return (await response.json()) as FortnoxTokenResponse;
}

// VIKTIGT: Fortnox refresh_tokens roterar — varje refresh ger en ny token.
// Spara den nya direkt, annars tappar du kopplingen vid nästa refresh.
export async function refreshAccessToken(refreshToken: string): Promise<FortnoxTokenResponse> {
  const response = await fetch(FORTNOX_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Refresh token expired or invalid – user must re-authorize");
  }
  return (await response.json()) as FortnoxTokenResponse;
}
