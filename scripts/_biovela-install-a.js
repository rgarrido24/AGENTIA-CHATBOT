const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

function write(rel, content) {
  const fp = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content, "utf8");
  console.log("wrote", rel);
}

const FILES = {};

function def(rel, content) {
  FILES[rel] = content;
  write(rel, content);
}

def("lib/client-panel-auth.ts", `import { NextRequest } from "next/server";

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
`);

def("lib/client-panel-config.ts", `export type FunnelStage =
  | "nuevo"
  | "contactado"
  | "interesado"
  | "cotizado"
  | "cerrado"
  | "perdido";

export const BIOVELA_FUNNEL_STAGES: { id: FunnelStage; label: string }[] = [
  { id: "nuevo", label: "Nuevo" },
  { id: "contactado", label: "Contactado" },
  { id: "interesado", label: "Interesado" },
  { id: "cotizado", label: "Cotizado" },
  { id: "cerrado", label: "Cerrado" },
  { id: "perdido", label: "Perdido" },
];

export type ClientPanelBrand = {
  name: string;
  primary: string;
  bg: string;
  success: string;
  text: string;
  border: string;
  radius: string;
};

export function getClientPanelBrand(clientId: string): ClientPanelBrand {
  if (clientId === "biovela") {
    return {
      name: "Biovela",
      primary: "#D4860A",
      bg: "#FAF9F7",
      success: "#2E7D52",
      text: "#1C1A18",
      border: "#E5E0D8",
      radius: "10px",
    };
  }
  return {
    name: clientId,
    primary: "#D4860A",
    bg: "#FAF9F7",
    success: "#2E7D52",
    text: "#1C1A18",
    border: "#E5E0D8",
    radius: "10px",
  };
}
`);

