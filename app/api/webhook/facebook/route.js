// agentia.software/api/webhook/facebook
// Maneja verificación (GET) y eventos entrantes (POST) de Messenger + Instagram DMs
// Meta unifica ambos en el mismo webhook cuando la app tiene los productos
// "Messenger" e "Instagram" suscritos.

import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN; // defínelo tú, string random

// ---------------------------------------------------------------------------
// GET — Meta llama esto UNA VEZ cuando configuras el webhook en el dashboard.
// Debe responder con el challenge en texto plano y status 200 si el token coincide.
// ---------------------------------------------------------------------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — eventos reales: mensajes nuevos, postbacks de botones, etc.
// El payload trae uno o más "entry", cada uno con el page_id (o IG business id)
// que recibió el evento. Así rutamos al cliente correcto.
// ---------------------------------------------------------------------------
export async function POST(req) {
  const body = await req.json();

  // Responder rápido a Meta (debe ser <20s, idealmente <5s) y procesar después.
  // Si vas a hacer llamadas a OpenAI/Claude para generar la respuesta del bot,
  // NO bloquees aquí — encola el procesamiento (ver nota al final).
  processEventsAsync(body).catch((err) =>
    console.error("Error procesando evento Facebook/IG:", err)
  );

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}

async function processEventsAsync(body) {
  if (body.object !== "page" && body.object !== "instagram") return;

  const db = await getMongoDb();

  for (const entry of body.entry || []) {
    const pageId = entry.id; // page_id (FB) o instagram business account id (IG)

    // Busca qué cliente de Agentia tiene esta página conectada
    const pageConfig = await db.collection("meta_pages").findOne({ pageId });

    if (!pageConfig) {
      console.warn(`Página ${pageId} recibió evento pero no está registrada`);
      continue;
    }
    if (!pageConfig.botEnabled) continue;

    const messaging = entry.messaging || [];
    for (const event of messaging) {
      if (event.message && !event.message.is_echo) {
        await handleIncomingMessage({
          db,
          pageConfig,
          senderId: event.sender.id,
          text: event.message.text,
          attachments: event.message.attachments,
        });
      }
      // event.postback -> clicks en botones / "Get Started"
      // event.message.is_echo -> mensajes que tú mismo enviaste (ignorar)
    }
  }
}

async function handleIncomingMessage({ db, pageConfig, senderId, text }) {
  // 1. Guarda el mensaje en tu colección de conversaciones (igual que WhatsApp)
  await db.collection("conversations").updateOne(
    { clientId: pageConfig.clientId, channel: "facebook", contactId: senderId },
    {
      $push: {
        messages: { from: "user", text, timestamp: new Date() },
      },
      $set: { lastMessageAt: new Date() },
    },
    { upsert: true }
  );

  // 2. Genera la respuesta (aquí conectas tu lógica de bot/IA existente)
  const replyText = await generateBotReply(pageConfig, text);

  // 3. Envía la respuesta vía Send API
  await sendFacebookMessage(pageConfig.pageAccessToken, senderId, replyText);

  // 4. Guarda la respuesta del bot
  await db.collection("conversations").updateOne(
    { clientId: pageConfig.clientId, channel: "facebook", contactId: senderId },
    { $push: { messages: { from: "bot", text: replyText, timestamp: new Date() } } }
  );
}

async function generateBotReply(pageConfig, userText) {
  // TODO: conectar con tu pipeline de IA existente (el mismo que usas en CWF/Deco House)
  return `Gracias por tu mensaje. En breve te atendemos.`;
}

async function sendFacebookMessage(pageAccessToken, recipientId, text) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    console.error("Error enviando mensaje a Facebook:", err);
  }
}

// NOTA SOBRE ESCALA:
// Si esperas volumen alto (varios clientes, muchos mensajes simultáneos),
// considera mover processEventsAsync a una cola (ej. el mismo patrón que usas
// con Railway para Baileys) en vez de procesarlo inline en la función serverless
// de Render. Para el MVP esto es suficiente.
