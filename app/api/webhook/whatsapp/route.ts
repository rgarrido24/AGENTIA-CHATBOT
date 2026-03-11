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

    let tipo: 'solicitar_documento' | 'imagen_recibida' | 'no_comprobante' | 'confirmacion' =
      'solicitar_documento';

    if (mediaBase64) {
      tipo = 'imagen_recibida';
    } else if (typeof mensaje === 'string' && isYesNo(mensaje)) {
      // Si no está en confirmación, el flow devuelve "no_aplica"
      tipo = 'confirmacion';
    } else if (typeof mensaje === 'string' && /no tengo|no cuento|sin comprobante/i.test(mensaje)) {
      tipo = 'no_comprobante';
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

