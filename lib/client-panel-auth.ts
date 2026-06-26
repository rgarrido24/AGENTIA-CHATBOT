import { NextRequest } from "next/server";

export function clientTokenEnvKey(clientId: string): string {
  return "TOKEN_" + clientId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

export function getExpectedClientPanelToken(clientId: string): string | undefined {
  return process.env[clientTokenEnvKey(clientId)];
}

export function extractClientPanelToken(request: NextRequest): string | null {
  const h = request.headers.get("x-client-token");
  if (h?.trim()) return h.trim();
  return new URL(request.url).searchParams.get("token");
}

export function verifyClientPanelAuth(request: NextRequest, clientId: string): boolean {
  const expected = getExpectedClientPanelToken(clientId);
  if (!expected) return false;
  const got = extractClientPanelToken(request);
  return !!got && got === expected;
}

export function jsonUnauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
