import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/lealtad/solicitud — { tipo: 'calculadora' | 'contratar', data, page }
 * Guarda el lead/solicitud de la landing /lealtad y avisa al dueño por WhatsApp.
 * Es "mejor esfuerzo": la landing no depende de esta respuesta.
 */
const hits = new Map<string, { n: number; reset: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  h.n += 1;
  return h.n > 10;
}

function clean(v: unknown, max = 160): string {
  return String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida';
  if (limited(ip)) return NextResponse.json({ ok: true });

  try {
    const body = (await req.json()) as { tipo?: string; data?: Record<string, unknown>; page?: string };
    const tipo = body.tipo === 'contratar' ? 'contratar' : body.tipo === 'calculadora' ? 'calculadora' : null;
    if (!tipo) return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });

    const d = body.data ?? {};
    const doc: Record<string, unknown> = { tipo, ip, page: clean(body.page, 300), createdAt: new Date(), estado: 'nuevo' };
    for (const k of Object.keys(d).slice(0, 25)) {
      const v = d[k];
      doc[k] = typeof v === 'number' && Number.isFinite(v) ? v : clean(v);
    }

    const db = await getMongoDb();
    await db.collection('lealtad_solicitudes').insertOne(doc);

    const to = process.env.ALERT_WHATSAPP_NUMBER?.trim();
    if (to) {
      const msg =
        tipo === 'contratar'
          ? `🟢 Agentia Lealtad — solicitud de contratación\nNegocio: ${doc.negocio}\nGiro: ${doc.giro}\nWhatsApp: ${doc.whatsapp}\nModelo: ${doc.detalle}\nSucursales: ${doc.sucursales} · ${doc.periodo}\nPago: ${doc.pago} · Total $${doc.total}`
          : `🧮 Agentia Lealtad — lead de calculadora\n${doc.nombre} (${doc.giro})\nWhatsApp: ${doc.whatsapp}\n${doc.clientes} clientes/mes · ticket $${doc.ticket} · pierde ${doc.pctPierde}%`;
      try {
        await bridgeSendMessage(process.env.AGENTIA_ALERTS_SENDER_CLIENT_ID || 'agentia-ventas', to, msg);
      } catch (e) {
        console.error('[lealtad/solicitud] alerta WhatsApp falló', e);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[lealtad/solicitud]', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
