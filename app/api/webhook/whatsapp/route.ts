import { NextRequest, NextResponse } from 'next/server';

function normalizeLeadId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // WhatsApp suele venir como: 521XXXXXXXXXX@c.us
  const digits = trimmed.replace(/\D/g, '');
  return digits || trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const leadId = normalizeLeadId(body?.leadId);
    const mensaje = typeof body?.mensaje === 'string' ? body.mensaje : '';
    const mediaBase64 = typeof body?.mediaBase64 === 'string' ? body.mediaBase64 : undefined;
    const mediaType = typeof body?.mediaType === 'string' ? body.mediaType : undefined;
    const leadData = (body?.leadData && typeof body.leadData === 'object') ? body.leadData : {};

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId requerido' }, { status: 400 });
    }

    const baseUrl =
      process.env.AGENTIA_CHATBOT_API_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      process.env.LEADS_API_BASE_URL?.replace(/\/$/, '') ||
      'https://agentia-chatbot-ventas.onrender.com';

    console.log('[webhook/whatsapp] baseUrl:', baseUrl, 'leadId:', leadId, 'hasMedia:', !!mediaBase64);

    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'izzi',
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

