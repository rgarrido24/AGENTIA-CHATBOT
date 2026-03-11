import { NextRequest, NextResponse } from 'next/server';
import { orchestrateSaleClosure } from '@/src/lib/sale-closure-flow';

function normalizeLeadId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // WhatsApp suele venir como: 521XXXXXXXXXX@c.us
  const digits = trimmed.replace(/\D/g, '');
  return digits || trimmed;
}

function isYesNo(text: string): boolean {
  return /^(s[ií]|yes|si|correcto|confirmo|ok|dale|adelante|así es|exacto|no|incorrecto|error|mal|equivocado|cambiar|corregir)$/i.test(
    text.trim()
  );
}

function hasHireIntent(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return /\bcontratar\b/.test(t)
    || /\bme\s+interesa\b/.test(t)
    || /\bquiero\b/.test(t)
    || /\bs[ií]\s+quiero\b/.test(t)
    || /\bacepto\b/.test(t)
    || /\bvamos\b/.test(t)
    || /\blisto\b/.test(t);
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

    let tipo: 'solicitar_documento' | 'imagen_recibida' | 'no_comprobante' | 'confirmacion' | null =
      null;

    if (mediaBase64) {
      tipo = 'imagen_recibida';
    } else if (mensaje && isYesNo(mensaje)) {
      tipo = 'confirmacion';
    } else if (mensaje && /no tengo|no cuento|sin comprobante/i.test(mensaje)) {
      tipo = 'no_comprobante';
    } else if (mensaje && hasHireIntent(mensaje)) {
      tipo = 'solicitar_documento';
    }

    // Si no hay tipo de evento de cierre, delegar al chatbot principal (Gemini) vía /api/chat
    if (!tipo) {
      const baseUrl =
        process.env.ANGENTIA_CHATBOT_API_URL?.replace(/\/$/, '') ||
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
        process.env.LEADS_API_BASE_URL?.replace(/\/$/, '') ||
        'https://agentia-chatbot-ventas.onrender.com';
      console.log('[webhook/whatsapp] baseUrl:', baseUrl, 'mensaje:', mensaje);
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
        }),
      });

      const chatJson = await chatRes.json().catch(() => ({}));
      return NextResponse.json(chatJson, { status: chatRes.status });
    }

    const tipoDocumento =
      mediaType && /pdf|application\/pdf/i.test(mediaType) ? 'comprobante' : 'ine';

    const result = await orchestrateSaleClosure({
      tipo,
      leadId,
      imageBase64: mediaBase64,
      tipoDocumento,
      respuestaCliente: mensaje,
      leadData,
    });

    return NextResponse.json({ ok: true, accion: result.accion, mensaje: result.mensaje ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

