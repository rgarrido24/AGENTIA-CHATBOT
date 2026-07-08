import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const PAYMENT_LINKS: Record<string, string | undefined> = {
  luciano:   process.env.STRIPE_PAYMENT_LINK_LUCIANO,
  decohouse: process.env.STRIPE_PAYMENT_LINK_DECOHOUSE,
  biovela:   process.env.STRIPE_PAYMENT_LINK_BIOVELA,
};

const ALLOWED_DOMAINS = ['agentia.software', 'localhost:3000', 'localhost:3010'];

const CONTRACT_ALERT_WHATSAPP = '529998080265';

async function trySendContractSignedWhatsApp(message: string): Promise<void> {
  const url = (process.env.WHATSAPP_SEND_URL ?? '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN ?? '').trim();
  if (!url || !token) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: CONTRACT_ALERT_WHATSAPP,
        type: 'text',
        text: { body: message },
      }),
    });
  } catch {
    // best-effort
  }
}

export async function POST(req: NextRequest) {
  // Domain verification
  const host = req.headers.get('host') ?? '';
  if (!ALLOWED_DOMAINS.some((d) => host.includes(d))) {
    return NextResponse.json({ error: 'Dominio no autorizado' }, { status: 403 });
  }

  try {
    const body              = await req.json().catch(() => ({}));
    const clientId          = typeof body.clientId   === 'string' ? body.clientId.trim()   : '';
    const signedName        = typeof body.signedName === 'string' ? body.signedName.trim() : '';
    const planName =
      typeof body.planName === 'string' ? body.planName.trim() : '';
    const price = typeof body.price === 'string' ? body.price.trim() : '';
    const setupFee   = typeof body.setupFee   === 'number' ? body.setupFee   : undefined;
    const totalToday = typeof body.totalToday === 'number' ? body.totalToday : undefined;
    const renewalDate =
      typeof body.renewalIso === 'string' ? new Date(body.renewalIso) : undefined;

    if (!clientId || !signedName) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const paymentLink = PAYMENT_LINKS[clientId];
    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Plan no encontrado o link de pago no configurado' },
        { status: 404 },
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const db = await getMongoDb();
    await db.collection('contract_signatures').insertOne({
      clientId,
      signedName,
      ...(planName && { planName }),
      ...(price && { price }),
      ip,
      userAgent:            req.headers.get('user-agent') ?? '',
      signedAt:             new Date(),
      ...(setupFee   !== undefined && { setupFee }),
      ...(totalToday !== undefined && { totalToday }),
      ...(renewalDate !== undefined && { renewalDate }),
    });

    const hoy = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const montoLine =
      price ||
      (totalToday !== undefined
        ? `$${totalToday} USD`
        : setupFee !== undefined
          ? `$${setupFee} USD`
          : '—');
    const planLine = planName || clientId;
    const waMsg = [
      '🎉 NUEVO CONTRATO FIRMADO',
      `Cliente: ${signedName}`,
      `Plan: ${planLine}`,
      `Monto: ${montoLine}`,
      `Fecha: ${hoy}`,
    ].join('\n');
    void trySendContractSignedWhatsApp(waMsg);

    return NextResponse.json({ paymentLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[contratar/sign]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
