import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

function resolveChatBaseUrl(): string {
  return (
    process.env.AGENTIA_CHATBOT_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    process.env.LEADS_API_BASE_URL?.replace(/\/$/, '') ||
    'https://agentia-chatbot-ventas.onrender.com'
  );
}

/** Payload WhatsApp Cloud API (Meta): tiene entry[0].changes[0].value */
function getWhatsAppCloudChangeValue(body: unknown): Record<string, unknown> | null {
  const entry = (body as { entry?: unknown })?.entry;
  if (!Array.isArray(entry) || !entry[0] || typeof entry[0] !== 'object') return null;
  const changes = (entry[0] as { changes?: unknown }).changes;
  if (!Array.isArray(changes) || !changes[0] || typeof changes[0] !== 'object') return null;
  const value = (changes[0] as { value?: unknown }).value;
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** true si es webhook Cloud API con al menos un mensaje en value.messages */
function isWhatsAppCloudApiWithMessages(body: unknown): boolean {
  const value = getWhatsAppCloudChangeValue(body);
  const messages = value?.messages;
  return Array.isArray(messages) && messages.length > 0;
}

type CloudInboundText = {
  phoneNumberId: string;
  from: string;
  text: string;
  messageId: string;
};

function parseCloudApiTextMessage(body: unknown): CloudInboundText | null {
  const value = getWhatsAppCloudChangeValue(body);
  const messages = value?.messages;
  if (!Array.isArray(messages) || !messages[0] || typeof messages[0] !== 'object') return null;
  const msg = messages[0] as {
    type?: string;
    from?: string;
    id?: string;
    text?: { body?: string };
  };
  if (msg.type !== 'text' || typeof msg.text?.body !== 'string') return null;
  const from = typeof msg.from === 'string' ? msg.from.trim() : '';
  if (!from) return null;
  const metadata = value?.metadata;
  const phoneNumberId =
    metadata && typeof metadata === 'object' && typeof (metadata as { phone_number_id?: string }).phone_number_id === 'string'
      ? String((metadata as { phone_number_id: string }).phone_number_id).trim()
      : '';
  if (!phoneNumberId) return null;
  const messageId = typeof msg.id === 'string' ? msg.id : `${from}:${msg.text.body.slice(0, 40)}`;
  return {
    phoneNumberId,
    from,
    text: msg.text.body,
    messageId,
  };
}

async function sendWhatsAppCloudApiTextReply(to: string, bodyText: string): Promise<Response> {
  const phoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  if (!phoneId || !token) {
    throw new Error('WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados');
  }
  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: bodyText },
    }),
  });
}

/**
 * Procesa mensajes entrantes de WhatsApp Cloud API (CWF cuando coincide phone_number_id).
 */
async function handleWhatsAppCloudApiPost(body: unknown): Promise<NextResponse> {
  if (!isWhatsAppCloudApiWithMessages(body)) {
    // Webhook Cloud API sin mensajes (p. ej. solo estados): 200 para Meta
    return NextResponse.json({ ok: true });
  }

  const parsed = parseCloudApiTextMessage(body);
  if (!parsed) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'non-text or incomplete' });
  }

  const expectedPhoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  if (!expectedPhoneNumberId) {
    console.error('[webhook/whatsapp] Cloud API: falta WHATSAPP_PHONE_NUMBER_ID');
    return NextResponse.json({ ok: false, error: 'WHATSAPP_PHONE_NUMBER_ID no configurado' }, { status: 500 });
  }
  if (parsed.phoneNumberId !== expectedPhoneNumberId) {
    console.log('[webhook/whatsapp] Cloud API ignorado — phone_number_id distinto:', parsed.phoneNumberId);
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (!(process.env.WHATSAPP_ACCESS_TOKEN || '').trim()) {
    console.error('[webhook/whatsapp] Cloud API CWF: falta WHATSAPP_ACCESS_TOKEN');
    return NextResponse.json({ ok: false, error: 'WHATSAPP_ACCESS_TOKEN no configurado' }, { status: 500 });
  }

  const key = dedupKey(parsed.from, `cloud:${parsed.messageId}`);
  if (isDuplicate(key)) {
    console.log('[webhook/whatsapp] Cloud API DEDUP:', parsed.from, parsed.messageId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  {
    const db = await getMongoDb();
    const cfg = await db.collection('business_configs').findOne({ clientId: 'cwf' }, { projection: { status: 1 } });
    if (cfg?.status && cfg.status !== 'activo') {
      console.log('[webhook/whatsapp] business_config inactivo — CWF');
      return NextResponse.json({ ok: true, botInactive: true });
    }
  }

  const baseUrl = resolveChatBaseUrl();
  const chatRes = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: 'cwf',
      platform: 'whatsapp',
      entryType: 'dm',
      message: parsed.text,
      senderId: parsed.from,
      senderName: parsed.from,
      pageId: 'whatsapp-cloud',
    }),
  });

  const chatJson = (await chatRes.json().catch(() => ({}))) as { reply?: string; error?: string };
  const replyText =
    typeof chatJson.reply === 'string' && chatJson.reply.trim()
      ? chatJson.reply
      : 'En este momento no puedo responderte. Intenta de nuevo en unos minutos.';

  let graphStatus = 0;
  try {
    const waRes = await sendWhatsAppCloudApiTextReply(parsed.from, replyText);
    graphStatus = waRes.status;
    if (!waRes.ok) {
      const errText = await waRes.text().catch(() => '');
      console.error('[webhook/whatsapp] Graph API error:', waRes.status, errText.slice(0, 500));
    }
  } catch (e) {
    console.error('[webhook/whatsapp] Graph API send failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { ok: false, chatStatus: chatRes.status, error: e instanceof Error ? e.message : 'graph send failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    chatStatus: chatRes.status,
    graphStatus,
  });
}

function normalizeLeadId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // WhatsApp suele venir como: 521XXXXXXXXXX@c.us
  const digits = trimmed.replace(/\D/g, '');
  return digits || trimmed;
}

// ─── Deduplicación de mensajes ────────────────────────────────────────────────
// Cuando dos bridges están vinculados al mismo número de WhatsApp actúan como
// dispositivos distintos y ambos reciben el mismo mensaje. El primero en llegar
// procesa; el segundo recibe 200 pero se descarta silenciosamente.

const DEDUP_WINDOW_MS = 10_000;
const DEDUP_MAX_ENTRIES = 2_000;

const dedupStore = new Map<string, number>(); // key → expiresAt

function dedupKey(leadId: string, mensaje: string): string {
  const msgSlug = mensaje.trim().slice(0, 120).replace(/\s+/g, ' ');
  return `${leadId}:${msgSlug}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const exp = dedupStore.get(key);
  if (exp && exp > now) return true;

  dedupStore.set(key, now + DEDUP_WINDOW_MS);

  if (dedupStore.size > DEDUP_MAX_ENTRIES) {
    for (const [k, expAt] of dedupStore) {
      if (expAt <= now) dedupStore.delete(k);
    }
  }
  return false;
}

// ─── Upsert de seguridad para agentia-ventas ──────────────────────────────────
// Persiste el lead en MongoDB ANTES de llamar al chat API, de modo que si el
// chat falla (Gemini error, config ausente, timeout) el contacto queda
// registrado con los campos mínimos requeridos por el pipeline.
//
// Regla: si el senderId es el admin NO se crea lead.
// Regla: si ya existe un lead fb-ads para este teléfono se actualiza ese en lugar
//        de crear uno nuevo con canal_origen=whatsapp.

function isAdminNumber(senderId: string): boolean {
  const adminRaw = process.env.AGENTIA_ADMIN_NUMBERS || process.env.ALERT_WHATSAPP_NUMBER || '';
  if (!adminRaw) return false;
  const senderDigits = senderId.replace(/\D/g, '');
  return adminRaw.split(',').some((n) => {
    const d = n.trim().replace(/\D/g, '');
    return d && (senderDigits.endsWith(d) || d.endsWith(senderDigits));
  });
}

async function ensureAgentiaVentasLead(params: {
  leadId: string;
  senderId: string;
  senderName: string | undefined;
  mensaje: string;
}): Promise<void> {
  // Never create a lead for the admin number
  if (isAdminNumber(params.senderId)) {
    console.log('[webhook/whatsapp] Admin number — skipping lead creation:', params.senderId);
    return;
  }

  try {
    const db = await getMongoDb();
    const now = new Date();

    // If an fb-ads lead already exists for this phone, update it instead of creating
    // a duplicate with canal_origen=whatsapp (happens when the welcome outbound lands
    // and the contact replies via WhatsApp).
    const senderDigits = params.senderId.replace(/\D/g, '');
    const existingFbLead = await db.collection('leads').findOne({
      clientId:     'agentia-ventas',
      canal_origen: 'fb-ads',
      $or: [
        { telefono: { $regex: senderDigits.slice(-10) } },
        { senderId: { $regex: senderDigits.slice(-10) } },
      ],
    });

    if (existingFbLead) {
      await db.collection('leads').updateOne(
        { leadId: existingFbLead.leadId },
        {
          $set: {
            lastMessage:   params.mensaje,
            lastMessageAt: now,
            updatedAt:     now,
            ...(params.senderName ? { senderName: params.senderName, nombre: params.senderName } : {}),
          },
          $inc: { messageCount: 1 },
        }
      );
      await db.collection('messages').insertOne({
        leadId:    existingFbLead.leadId,
        clientId:  'agentia-ventas',
        senderId:  params.senderId,
        canal:     'whatsapp',
        direccion: 'entrante',
        contenido: params.mensaje,
        createdAt: now,
      });
      console.log('[webhook/whatsapp] FB lead actualizado con reply WhatsApp:', existingFbLead.leadId);
      return;
    }

    const leadMongoId = `${params.senderId}_whatsapp-bridge_agentia-ventas`;

    await db.collection('leads').updateOne(
      { leadId: leadMongoId },
      {
        $set: {
          // Campos que se actualizan en CADA mensaje
          lastMessage: params.mensaje,
          lastMessageAt: now,
          updatedAt: now,
          platform: 'whatsapp',
          source: 'whatsapp',
          telefono: params.senderId,
          nombre: params.senderName ?? params.senderId,
          senderName: params.senderName ?? params.senderId,
        },
        $setOnInsert: {
          // Campos que se escriben UNA SOLA VEZ al crear el documento
          // Ninguno de estos campos puede repetirse en $set ni en $inc
          leadId: leadMongoId,
          clientId: 'agentia-ventas',
          pageId: 'whatsapp-bridge',
          senderId: params.senderId,
          pipeline: 'agentia',
          canal_origen: 'whatsapp',
          status: 'nuevos',
          status_vendedor: 'nuevo',
          bot_status: 'active',
          tags: [],
          createdAt: now,
        },
        // messageCount solo en $inc, nunca en $set ni $setOnInsert
        $inc: { messageCount: 1 },
      },
      { upsert: true }
    );

    // Guardar mensaje en colección de mensajes para historial
    await db.collection('messages').insertOne({
      leadId: leadMongoId,
      clientId: 'agentia-ventas',
      senderId: params.senderId,
      canal: 'whatsapp',
      direccion: 'entrante',
      contenido: params.mensaje,
      createdAt: now,
    });

    console.log('[webhook/whatsapp] Lead agentia-ventas upserted:', leadMongoId);
  } catch (err) {
    // No bloquear el flujo principal si esto falla
    console.error('[webhook/whatsapp] Error al persistir lead agentia-ventas:', err instanceof Error ? err.message : err);
  }
}

/** Verificación webhook WhatsApp Cloud API (Meta): GET hub.challenge */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'AgentiaSecretToken2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  // console.error sobrevive removeConsole en producción (console.log no)
  console.error('[webhook/whatsapp] POST recibido', {
    method: request.method,
    ua: request.headers.get('user-agent') ?? '(vacío)',
    at: new Date().toISOString(),
  });
  try {
    const body = await request.json().catch(() => ({}));

    if (getWhatsAppCloudChangeValue(body) !== null) {
      console.error('[webhook/whatsapp] payload Cloud API', {
        hasMessages: isWhatsAppCloudApiWithMessages(body),
      });
      return await handleWhatsAppCloudApiPost(body);
    }

    const leadId = normalizeLeadId(body?.leadId);
    const mensaje = typeof body?.mensaje === 'string' ? body.mensaje : '';
    const mediaBase64 = typeof body?.mediaBase64 === 'string' ? body.mediaBase64 : undefined;
    const mediaType = typeof body?.mediaType === 'string' ? body.mediaType : undefined;
    const leadData = (body?.leadData && typeof body.leadData === 'object') ? body.leadData : {};
    const senderName: string | undefined = typeof (leadData as any)?.nombre === 'string' ? (leadData as any).nombre : undefined;
    // clientId dinámico: el bridge lo envía; default 'izzi' para compatibilidad hacia atrás
    const clientId = (typeof body?.clientId === 'string' && body.clientId.trim()) ? body.clientId.trim() : 'izzi';

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId requerido' }, { status: 400 });
    }

    // Descartar duplicados (mismo mensaje de dos bridges en los últimos 10s)
    const key = dedupKey(leadId, mensaje + (mediaBase64 ? ':media' : ''));
    if (isDuplicate(key)) {
      console.log(`[webhook/whatsapp] DEDUP descartado — leadId:${leadId} clientId:${clientId}`);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Kill-switch: si el cliente está inactivo en business_configs, responder 200 silencioso
    {
      const db  = await getMongoDb();
      const cfg = await db.collection('business_configs').findOne(
        { clientId },
        { projection: { status: 1 } },
      );
      if (cfg?.status && cfg.status !== 'activo') {
        console.log('[webhook/whatsapp] business_config inactivo — bot desactivado para clientId:', clientId);
        return NextResponse.json({ ok: true, botInactive: true });
      }
    }

    // Persistir lead de agentia-ventas antes del chat (seguro ante fallos del chat API)
    if (clientId === 'agentia-ventas') {
      await ensureAgentiaVentasLead({ leadId, senderId: leadId, senderName, mensaje });
    }

    const baseUrl = resolveChatBaseUrl();
    console.log('[webhook/whatsapp] baseUrl:', baseUrl, 'leadId:', leadId, 'clientId:', clientId, 'hasMedia:', !!mediaBase64);

    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        platform: 'whatsapp',
        entryType: 'dm',
        message: mensaje,
        senderId: leadId,
        senderName,
        pageId: 'whatsapp-bridge',
        ...(mediaBase64 ? { mediaBase64, mimeType: mediaType || 'image/jpeg' } : {}),
      }),
    });

    const chatJson = await chatRes.json().catch(() => ({}));
    return NextResponse.json(chatJson, { status: chatRes.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
