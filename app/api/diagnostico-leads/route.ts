import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { sendPushNotification } from '@/lib/panel-push';

export const dynamic = 'force-dynamic';

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''
  );
}

async function notifyAgentiaPanel(lead: {
  nombre: string;
  negocio: string;
  whatsapp: string;
  email?: string | null;
  producto: string;
}): Promise<void> {
  const senderId = lead.whatsapp || lead.email || lead.negocio;
  await sendPushNotification({
    clientId: 'agentia-ventas',
    senderId,
    senderName: lead.nombre,
    message: `Nuevo diagnóstico (${lead.producto}): ${lead.nombre} · ${lead.negocio}${
      lead.whatsapp ? ` · ${lead.whatsapp}` : ''
    }`,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  const hp = String(body.website ?? '').trim();
  if (hp) return NextResponse.json({ ok: true });

  const nombre = String(body.nombre ?? '').trim();
  const negocio = String(body.negocio ?? '').trim();
  const whatsapp = String(body.whatsapp ?? '').replace(/\D/g, '');
  const email = String(body.email ?? '').trim().toLowerCase();
  const producto = String(body.producto ?? '').trim();
  const origen = String(body.origen ?? 'landing').trim();
  const url = String(body.url ?? '').trim() || null;
  const roi = body.roi ?? null;

  if (!nombre || !negocio || !whatsapp || !producto) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 });
  }

  if (whatsapp.length < 10) {
    return NextResponse.json({ ok: false, error: 'WhatsApp inválido' }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
  }

  const doc = {
    nombre,
    negocio,
    whatsapp,
    email: email || null,
    producto,
    roi,
    origen,
    url,
    status: 'nuevo',
    createdAt: new Date(),
    meta: {
      ip: clientIP(req),
      ua: req.headers.get('user-agent') ?? '',
      referer: req.headers.get('referer') ?? '',
    },
  };

  try {
    const db = await getMongoDb();
    await db.collection('diagnostico_leads').insertOne(doc);
  } catch (err) {
    console.error('[diagnostico-leads] Error guardando:', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }

  try {
    await notifyAgentiaPanel(doc);
  } catch (err) {
    console.error(
      '[diagnostico-leads] push falló:',
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({ ok: true });
}
