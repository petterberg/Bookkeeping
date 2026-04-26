// Bas-klient mot Fortnox 3.0-API + token-lagring.
//
// Token-lagring är fil-baserad för demo och fungerar i lokal körning.
// På Vercel (eller andra serverless-miljöer) är endast /tmp skrivbart och
// dess innehåll lever bara per invocation — då bör du flytta till en KV-store
// eller databas. Vi skriver till os.tmpdir() så att produktion inte kraschar,
// men en ny invocation kommer behöva re-autentisera.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { refreshAccessToken } from "./auth";

const TOKEN_FILE = path.join(
  process.env.FORTNOX_TOKEN_PATH ?? (process.env.VERCEL ? os.tmpdir() : process.cwd()),
  ".fortnox-tokens.json",
);

export interface TokenStore {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
}

function readTokens(): TokenStore | null {
  try {
    const data = fs.readFileSync(TOKEN_FILE, "utf-8");
    return JSON.parse(data) as TokenStore;
  } catch {
    return null;
  }
}

function writeTokens(tokens: TokenStore): void {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function saveTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  writeTokens({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + (expiresIn - 60) * 1000, // 60 s marginal
  });
}

export function clearTokens(): void {
  try {
    fs.unlinkSync(TOKEN_FILE);
  } catch {
    /* ignore */
  }
}

export function isConnected(): boolean {
  return readTokens() !== null;
}

export function readTokenStore(): TokenStore | null {
  return readTokens();
}

async function getValidAccessToken(): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new Error("Fortnox ej ansluten");

  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  const next = await refreshAccessToken(tokens.refreshToken);
  // KRITISKT: spara nya tokens omedelbart innan vi returnerar
  saveTokens(next.access_token, next.refresh_token, next.expires_in);
  return next.access_token;
}

const BASE_URL = "https://api.fortnox.se/3";

export async function fortnoxFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = await getValidAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
  // Sätt Content-Type bara om vi inte skickar FormData (då sätter fetch boundary)
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });

  // Rate limit (300 req/min per tenant) — vänta och försök igen
  if (response.status === 429) {
    const retry = Number(response.headers.get("retry-after") ?? "2");
    await new Promise((r) => setTimeout(r, retry * 1000));
    return fortnoxFetch(endpoint, options);
  }

  return response;
}

export async function fortnoxGet<T>(endpoint: string): Promise<T> {
  const response = await fortnoxFetch(endpoint);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fortnox GET ${endpoint} failed (${response.status}): ${error}`);
  }
  return (await response.json()) as T;
}

export async function fortnoxPost<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fortnoxFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fortnox POST ${endpoint} failed (${response.status}): ${error}`);
  }
  return (await response.json()) as T;
}
