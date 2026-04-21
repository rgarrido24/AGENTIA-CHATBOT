import { NextRequest, NextResponse } from 'next/server';

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
//
// Clave: leadId + primeros 120 chars del mensaje + ventana de 10 segundos.
// En Render (proceso persistente) el Map vive en memoria del proceso — correcto.
// En serverless sería por instancia, pero el middleware de dedup en BD sería
// el siguiente paso si escala a múltiples instancias.

const DEDUP_WINDOW_MS = 10_000;
const DEDUP_MAX_ENTRIES = 2_000;

const dedupStore = new Map<string, number>(); // key → expiresAt

function dedupKey(leadId: string, mensaje: string): string {
  // Fingerprint del mensaje: leadId + primeros 120 chars normalizados
  const msgSlug = mensaje.trim().slice(0, 120).replace(/\s+/g, ' ');
  return `${leadId}:${msgSlug}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const exp = dedupStore.get(key);
  if (exp && exp > now) return true;

  // Registrar como procesado
  dedupStore.set(key, now + DEDUP_WINDOW_MS);

  // Limpiar entradas expiradas si la store crece demasiado
  if (dedupStore.size > DEDUP_MAX_ENTRIES) {
    for (const [k, expAt] of dedupStore) {
      if (expAt <= now) dedupStore.delete(k);
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const leadId = normalizeLeadId(body?.leadId);
    const mensaje = typeof body?.mensaje === 'string' ? body.mensaje : '';
    const mediaBase64 = typeof body?.mediaBase64 === 'string' ? body.mediaBase64 : undefined;
    const mediaType = typeof body?.mediaType === 'string' ? body.mediaType : undefined;
    const leadData = (body?.leadData && typeof body.leadData === 'object') ? body.leadData : {};
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
        senderName: (leadData as any)?.nombre,
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
