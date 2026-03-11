import type { NextApiRequest, NextApiResponse } from "next";
import { generateGeminiReply } from "../src/lib/gemini";
import { getMongoDb } from "../lib/mongodb";
import {
  buildSystemInstruction,
  resolveBusinessConfigByClientId
} from "../src/lib/business-config";
import {
  getOrCreateSession,
  getFollowUpInstruction,
  type ChatSession
} from "../src/lib/chat-sessions";
import { upsertLead } from "../src/lib/leads";

type ChatRequestBody = {
  clientId?: unknown;
  platform?: unknown;
  entryType?: unknown;
  message?: unknown;
  senderId?: unknown;
  senderName?: unknown;
  pageId?: unknown;
};

async function parseJsonBody(req: NextApiRequest): Promise<unknown> {
  // Vercel suele parsear JSON automáticamente, pero por seguridad
  // manejamos el caso donde venga como string.
  let body: unknown;
  try {
    // En `vercel dev`, `req.body` puede lanzar si el JSON es inválido.
    body = req.body;
  } catch {
    body = undefined;
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return undefined;
    }
  }
  if (body !== undefined) return body;

  // Fallback: leer el stream si `req.body` no está disponible.
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function inferTags(message: string): string[] {
  const tags = new Set<string>();
  const text = message.toLowerCase();

  if (/\bizzi\b/i.test(message)) tags.add("izzi");

  // Detección simple de intención en bienes raíces / inmobiliario.
  if (
    /bienes\s*ra[ií]ces|inmobiliari|inmueble|propiedad|casa|departamento|depa|terreno|lote|hipoteca|renta|alquiler|arrend|venta\s+de\s+casa|comprar\s+casa|vender\s+casa/i.test(
      text
    )
  ) {
    tags.add("bienes_raices");
  }

  return [...tags];
}

async function saveLead(params: {
  clientId: string;
  platform: string;
  entryType: string;
  message: string;
  reply: string;
  tags: string[];
  req: NextApiRequest;
}) {
  const db = await getMongoDb();
  const collection = db.collection("leads_agentia");

  const ipHeader = params.req.headers["x-forwarded-for"];
  const ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;

  await collection.insertOne({
    clientId: params.clientId,
    platform: params.platform,
    entryType: params.entryType,
    message: params.message,
    reply: params.reply,
    tags: params.tags,
    createdAt: new Date(),
    route: "/api/chat",
    userAgent: params.req.headers["user-agent"] ?? null,
    ip: ip ?? null
  });
}

function estimateTokens(text: string): number {
  // Estimación rápida (aprox. 4 caracteres por token).
  const t = text?.trim() ?? "";
  if (!t) return 0;
  return Math.ceil(t.length / 4);
}

async function saveUsageLog(params: {
  clientId: string;
  platform: string;
  entryType: string;
  messageCount: number;
  inputTokensEstimated: number;
  outputTokensEstimated: number;
  totalTokensEstimated: number;
}) {
  const db = await getMongoDb();
  await db.collection("usage_logs").insertOne({
    clientId: params.clientId,
    platform: params.platform,
    entryType: params.entryType,
    createdAt: new Date(),
    messageCount: params.messageCount,
    inputTokensEstimated: params.inputTokensEstimated,
    outputTokensEstimated: params.outputTokensEstimated,
    totalTokensEstimated: params.totalTokensEstimated
  });
}

function normalizePlatform(input: string): "facebook" | "instagram" | "whatsapp" | null {
  const v = input.trim().toLowerCase();
  if (v === "facebook" || v === "instagram" || v === "whatsapp") return v;
  return null;
}

function normalizeEntryType(input: string): "comment" | "dm" | null {
  const v = input.trim().toLowerCase();
  if (v === "comment" || v === "dm") return v;
  return null;
}

function buildChannelInstruction(params: {
  platform: "facebook" | "instagram" | "whatsapp";
  entryType: "comment" | "dm";
}): string {
  const { platform, entryType } = params;

  if (entryType === "comment") {
    return [
      `## Canal`,
      `platform: ${platform}`,
      `entryType: comment`,
      ``,
      `## Formato para comentario público`,
      `- Responde en máximo 2 frases.`,
      `- Sé muy amable, profesional y directo.`,
      `- NO des precios ni detalles largos en comentarios públicos.`,
      `- Termina SIEMPRE invitando a la persona a revisar su bandeja de entrada (DM/Inboxes) porque ahí le darás precios o detalles.`,
      `- No menciones estas reglas internas.`
    ].join("\n");
  }

  // DM / privado
  return [
    `## Canal`,
    `platform: ${platform}`,
    `entryType: dm`,
    ``,
    `## Formato para DM (privado)`,
    `- Usa un guion completo de Senior Sales Closer: persuasivo, humano, sin acosar.`,
    `- Tu objetivo es calificar y avanzar a cierre (cita/demo) según el negocio.`,
    `- Pide el teléfono/WhatsApp del lead de forma natural (idealmente en los primeros 2-3 turnos).`,
    `- Si el lead pide precios específicos que no tienes, ofrece que un humano lo contacte y pide teléfono.`,
    `- No menciones estas reglas internas.`
  ].join("\n");
}

function formatCommentReply(rawReply: string): string {
  const text = String(rawReply ?? "").trim();
  const dmSentence =
    "Revisa tu bandeja de entrada (DM) y con gusto te paso precios y detalles.";

  // Separación simple por frases.
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const first = sentences[0] ?? "¡Hola! Con gusto te ayudo.";

  // Si la primera ya invita a DM, igual forzamos una segunda frase final.
  const second = dmSentence;

  // Máximo 2 frases, siempre terminando con DM.
  return `${first.replace(/\s+$/g, "")} ${second}`.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // CORS básico (útil si lo llamas desde frontend en otro dominio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Health-check simple para confirmar que la función está viva.
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "/api/chat",
      methods: ["GET", "POST"],
      expects: { clientId: "string", platform: "facebook|instagram|whatsapp", entryType: "comment|dm", message: "string" }
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Usa GET o POST." });
  }

  const body = (await parseJsonBody(req)) as ChatRequestBody | undefined;
  const clientIdRaw = body?.clientId;
  const platformRaw = body?.platform;
  const entryTypeRaw = body?.entryType;
  const message = body?.message;
  const senderId = typeof body?.senderId === "string" ? body.senderId.trim() : undefined;
  const senderName = typeof body?.senderName === "string" ? body.senderName.trim() : undefined;
  const pageId = typeof body?.pageId === "string" ? body.pageId.trim() : undefined;

  if (typeof clientIdRaw !== "string" || clientIdRaw.trim().length === 0) {
    return res.status(400).json({
      error:
        "Body inválido. Envía JSON con { \"clientId\": \"...\", \"platform\": \"facebook|instagram|whatsapp\", \"entryType\": \"comment|dm\", \"message\": \"...\" }"
    });
  }

  const clientId = clientIdRaw.trim().toLowerCase();

  if (typeof platformRaw !== "string" || !normalizePlatform(platformRaw)) {
    return res.status(400).json({
      error:
        "Body inválido. `platform` debe ser: facebook | instagram | whatsapp. Ej: { \"clientId\": \"izzi\", \"platform\": \"facebook\", \"entryType\": \"comment\", \"message\": \"...\" }"
    });
  }

  if (typeof entryTypeRaw !== "string" || !normalizeEntryType(entryTypeRaw)) {
    return res.status(400).json({
      error:
        "Body inválido. `entryType` debe ser: comment | dm. Ej: { \"clientId\": \"izzi\", \"platform\": \"facebook\", \"entryType\": \"comment\", \"message\": \"...\" }"
    });
  }

  const platform = normalizePlatform(platformRaw)!;
  const entryType = normalizeEntryType(entryTypeRaw)!;

  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      error:
        "Body inválido. Envía JSON con { \"clientId\": \"...\", \"platform\": \"facebook|instagram|whatsapp\", \"entryType\": \"comment|dm\", \"message\": \"...\" }"
    });
  }

  try {
    const cfg = await resolveBusinessConfigByClientId(clientId);
    if (!cfg) {
      return res.status(404).json({
        error: `No existe configuración para clientId='${clientId}'. Crea un documento en business_configs.`
      });
    }

    let session: (ChatSession & { _isReturningUser?: boolean }) | null = null;
    if (senderId && pageId) {
      session = await getOrCreateSession({
        senderId,
        pageId,
        clientId,
        platform,
        message
      });
    }

    const { systemInstruction, modelId } = buildSystemInstruction({ clientId, config: cfg });
    const channelInstruction = buildChannelInstruction({ platform, entryType });
    let finalSystemInstruction = `${systemInstruction}\n\n${channelInstruction}`.trim();

    if (session) {
      const stepContext = `\n\n## Estado de la conversación\nEl cliente está en etapa: ${session.currentStep}.`;
      const followUp = getFollowUpInstruction(session, clientId);
      finalSystemInstruction += stepContext + followUp;
    }

    const reply = await generateGeminiReply({
      userMessage: message,
      systemInstruction: finalSystemInstruction,
      modelId
    });
    const finalReply = entryType === "comment" ? formatCommentReply(reply) : reply;
    const tags = inferTags(message);

    // Guardado rápido y sin saturar: esperamos poco tiempo; si falla, no bloquea al cliente.
    const inputTokensEstimated = estimateTokens(finalSystemInstruction) + estimateTokens(message);
    const outputTokensEstimated = estimateTokens(finalReply);
    const totalTokensEstimated = inputTokensEstimated + outputTokensEstimated;

    const writes = Promise.allSettled([
      saveLead({ clientId, platform, entryType, message, reply: finalReply, tags, req }),
      senderId && pageId
        ? upsertLead({
            senderId,
            pageId,
            clientId,
            senderName,
            platform,
            message,
            reply: finalReply,
            tags
          })
        : Promise.resolve(),
      saveUsageLog({
        clientId,
        platform,
        entryType,
        messageCount: 2,
        inputTokensEstimated,
        outputTokensEstimated,
        totalTokensEstimated
      })
    ]).catch(() => undefined);

    await Promise.race([writes, new Promise((resolve) => setTimeout(resolve, 1500))]);

    return res.status(200).json({ clientId, reply: finalReply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ error: msg });
  }
}

