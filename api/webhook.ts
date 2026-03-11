import type { NextApiRequest, NextApiResponse } from "next";
import { resolveBusinessConfigByPageId } from "../src/lib/business-config";

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  // Importante: en Vercel CLI `env add` puede dejar un salto de línea al final.
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Por si alguien lo guarda con comillas.
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function getSingleQuery(req: NextApiRequest, key: string): string | undefined {
  const v = req.query?.[key];
  if (Array.isArray(v)) return v[0];
  if (typeof v === "string") return v;
  return undefined;
}

async function safeReadJson(req: NextApiRequest): Promise<any | undefined> {
  // Vercel puede parsear JSON automáticamente, pero en dev puede variar.
  try {
    const b: any = (req as any).body;
    if (b && typeof b === "object") return b;
    if (typeof b === "string") return JSON.parse(b);
  } catch {
    // ignore
  }

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

function getBaseUrl(req: NextApiRequest): string {
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"];
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const h = Array.isArray(host) ? host[0] : host;
  if (!h) return "https://agentia-chatbot-ventas.vercel.app";
  return `${proto}://${h}`;
}

function pickFirstString(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function inferPlatform(body: any): "facebook" | "instagram" | "whatsapp" {
  const obj = String(body?.object ?? "").toLowerCase();
  if (obj.includes("instagram")) return "instagram";
  return "facebook";
}

async function getFacebookUserName(
  accessToken: string,
  userId: string
): Promise<string | undefined> {
  try {
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(userId)}?fields=name&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const json = (await res.json()) as { name?: string };
    return typeof json?.name === "string" ? json.name.trim() : undefined;
  } catch {
    return undefined;
  }
}

async function sendMessengerReply(params: {
  accessToken: string;
  recipientId: string;
  text: string;
}) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(
    params.accessToken
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      recipient: { id: params.recipientId },
      message: { text: params.text }
    })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Send API failed: ${res.status} ${res.statusText} ${t}`);
  }
}

async function replyToComment(params: { accessToken: string; commentId: string; text: string }) {
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(
    params.commentId
  )}/comments?access_token=${encodeURIComponent(params.accessToken)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: params.text })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Comment reply failed: ${res.status} ${res.statusText} ${t}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Meta recomienda responder rápido.
    if (req.method === "GET") {
      const mode = getSingleQuery(req, "hub.mode");
      const token = getSingleQuery(req, "hub.verify_token");
      const challenge = getSingleQuery(req, "hub.challenge");

      const expectedToken = getEnv("META_VERIFY_TOKEN");
      if (!expectedToken) {
        console.log("[webhook][verify] META_VERIFY_TOKEN no configurado");
        // Nunca 500: responde 403 para que quede claro el problema.
        return res.status(403).json({ error: "META_VERIFY_TOKEN not configured" });
      }

      if (mode === "subscribe" && token === expectedToken) {
        // Debe regresar el challenge como texto plano.
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.status(200).send(challenge ?? "");
      }

      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = await safeReadJson(req);

    // MVP: aceptar eventos y responder OK. (Luego aquí haremos routing a /api/chat + reply a Meta).
    // Intentamos extraer algunos campos para debug básico.
    const summary: any = { received: true };

    const entry0 = body?.entry?.[0];
    const pageId =
      pickFirstString(entry0?.id) ??
      pickFirstString(entry0?.messaging?.[0]?.recipient?.id) ??
      pickFirstString(body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id);

    const messaging0 = entry0?.messaging?.[0];
    const textDm = pickFirstString(messaging0?.message?.text);
    const senderId = pickFirstString(messaging0?.sender?.id);

    const change0 = entry0?.changes?.[0];
    const changeValue = change0?.value;
    const commentId =
      pickFirstString(changeValue?.comment_id) ??
      pickFirstString(changeValue?.commentId) ??
      pickFirstString(changeValue?.id);
    const textComment = pickFirstString(changeValue?.message, changeValue?.text);

    const isComment = Boolean(commentId && textComment);
    const isDm = Boolean(senderId && textDm);

    if (pageId) summary.pageId = pageId;
    if (senderId) summary.senderId = senderId;
    if (commentId) summary.commentId = commentId;
    if (textDm) summary.text = textDm;
    if (!textDm && textComment) summary.text = textComment;

    if (!pageId || (!isDm && !isComment)) {
      return res.status(200).json({ status: "EVENT_RECEIVED", ...summary });
    }

    let cfg = null;
    try {
      cfg = await resolveBusinessConfigByPageId(pageId);
    } catch (dbErr) {
      console.log("[webhook][db] error resolviendo config:", dbErr);
      return res.status(200).json({ status: "EVENT_RECEIVED", ...summary });
    }

    if (!cfg?.accessToken) {
      console.log("[webhook] No accessToken for pageId:", pageId, "clientId:", cfg?.clientId);
      return res.status(200).json({ status: "EVENT_RECEIVED", ...summary });
    }

    const platform = inferPlatform(body);
    const entryType = isComment ? "comment" : "dm";
    const incomingText = isComment ? textComment! : textDm!;

    let senderName: string | undefined;
    if (senderId && isDm) {
      senderName = await getFacebookUserName(cfg.accessToken, senderId);
    }

    const baseUrl = getBaseUrl(req);
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: cfg.clientId,
        platform,
        entryType,
        message: incomingText,
        senderId: senderId ?? undefined,
        senderName: senderName ?? undefined,
        pageId
      })
    });

    const chatJson = await chatRes.json().catch(() => ({}));
    const replyText = String(chatJson?.reply ?? "").trim();
    if (!chatRes.ok || !replyText) {
      console.log("[webhook] /api/chat failed:", chatRes.status, chatJson);
      return res.status(200).json({ status: "EVENT_RECEIVED", ...summary });
    }

    try {
      if (isComment) {
        await replyToComment({ accessToken: cfg.accessToken, commentId: commentId!, text: replyText });
      } else {
        await sendMessengerReply({ accessToken: cfg.accessToken, recipientId: senderId!, text: replyText });
      }
    } catch (sendErr) {
      console.log("[webhook][send] error enviando respuesta:", sendErr);
    }

    try {
      // Facebook/Instagram (Messenger-style)
      if (body?.object && Array.isArray(body?.entry)) {
        const entry0 = body.entry[0];
        const messaging0 = entry0?.messaging?.[0];
        if (messaging0?.message?.text) summary.text = messaging0.message.text;
        if (messaging0?.sender?.id) summary.senderId = messaging0.sender.id;
        if (messaging0?.recipient?.id) summary.recipientId = messaging0.recipient.id;
        summary.object = body.object;
      }

      // WhatsApp Cloud API
      const change0 = body?.entry?.[0]?.changes?.[0];
      const wa = change0?.value;
      const waMsg0 = wa?.messages?.[0];
      if (waMsg0?.text?.body) summary.text = waMsg0.text.body;
      if (waMsg0?.from) summary.from = waMsg0.from;
      if (wa?.metadata?.phone_number_id) summary.phoneNumberId = wa.metadata.phone_number_id;
    } catch (innerErr) {
      console.log("[webhook][post] parse-summary error:", innerErr);
    }

    return res.status(200).json({ status: "EVENT_RECEIVED", ...summary });
  } catch (err) {
    // Nunca dejar que truene la función (evita 500 por excepción no manejada).
    console.log("[webhook] unhandled error:", err);
    return res.status(200).json({ status: "EVENT_RECEIVED", received: true });
  }
}

