import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

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

async function ensureAgentiaVentasLead(params: {
  leadId: string;
  senderId: string;
  senderName: string | undefined;
  mensaje: string;
}): Promise<void> {
  try {
    const db = await getMongoDb();
    const now = new Date();
    const leadMongoId = `${params.senderId}_whatsapp-bridge_agentia-ventas`;

    await db.collection('leads').updateOne(
      { leadId: leadMongoId },
      {
        $set: {
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
          leadId: leadMongoId,
          clientId: 'agentia-ventas',
          pageId: 'whatsapp-bridge',
          senderId: params.senderId,
          pipeline: 'agentia',
          canal_origen: 'whatsapp',
          status: 'nuevos',
          status_vendedor: 'nuevo',
          bot_status: 'active',
          messageCount: 0,
          tags: [],
          createdAt: now,
        },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

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

    // Persistir lead de agentia-ventas antes del chat (seguro ante fallos del chat API)
    if (clientId === 'agentia-ventas') {
      await ensureAgentiaVentasLead({ leadId, senderId: leadId, senderName, mensaje });
    }

    const baseUrl =
      process.env.AGENTIA_CHATBOT_API_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      process.env.LEADS_API_BASE_URL?.replace(/\/$/, '') ||
      'https://agentia-chatbot-ventas.onrender.com';

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
