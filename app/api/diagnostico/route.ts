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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const hp = String(body.website ?? '').trim();
  if (hp) return NextResponse.json({ ok: true });

  const nombre = String(body.nombre ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? '').replace(/\D/g, '');
  const tipo_negocio = String(body.tipo_negocio ?? '').trim();
  const descripcion = String(body.descripcion ?? '').trim();

  if (!nombre || !email || !tipo_negocio || !descripcion) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const whatsappDigits = whatsapp.replace(/\D/g, '');
  if (whatsappDigits && whatsappDigits.length < 10) {
    return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 });
  }

  const createdAt = new Date();
  const db = await getMongoDb();

  await db.collection('diagnostico_leads').insertOne({
    nombre,
    email,
    whatsapp: whatsappDigits || undefined,
    tipo_negocio,
    descripcion,
    createdAt,
    meta: {
      ip: clientIP(req),
      ua: req.headers.get('user-agent') ?? '',
      referer: req.headers.get('referer') ?? '',
    },
  });

  try {
    await sendPushNotification({
      clientId: 'agentia-ventas',
      senderId: whatsappDigits || email,
      senderName: nombre,
      message: `Nuevo diagnóstico: ${nombre} · ${tipo_negocio}${whatsappDigits ? ` · ${whatsappDigits}` : ''}`,
    });
  } catch (err) {
    console.error(
      '[api/diagnostico] push falló:',
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({ ok: true });
}
