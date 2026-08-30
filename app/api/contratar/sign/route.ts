import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const PAYMENT_LINKS: Record<string, string | undefined> = {
  luciano:   process.env.STRIPE_PAYMENT_LINK_LUCIANO,
  decohouse: process.env.STRIPE_PAYMENT_LINK_DECOHOUSE,
};

const BIOVELA_PAYMENT_LINKS: Record<string, string | undefined> = {
  setup:     process.env.STRIPE_PAYMENT_LINK_BIOVELA_SETUP,
  prorate:   process.env.STRIPE_PAYMENT_LINK_BIOVELA_PRORATE,
  recurring: process.env.STRIPE_PAYMENT_LINK_BIOVELA_RECURRING,
};

const ALLOWED_DOMAINS = ['agentia.software', 'localhost:3000', 'localhost:3010'];

import { AGENTIA_WHATSAPP_DIGITS_E164 } from '@/lib/agentia-contact';

const CONTRACT_ALERT_WHATSAPP = AGENTIA_WHATSAPP_DIGITS_E164;

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
    const prorateMx  = typeof body.prorateMx  === 'number' ? body.prorateMx  : undefined;
    const signOnly   = body.signOnly === true;
    const paymentKind =
      typeof body.paymentKind === 'string' ? body.paymentKind.trim() : '';
    const renewalDate =
      typeof body.renewalIso === 'string' ? new Date(body.renewalIso) : undefined;

    if (!clientId || !signedName) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    let paymentLink: string | undefined;

    if (clientId === 'biovela') {
      if (signOnly) {
        paymentLink = undefined;
      } else if (paymentKind && BIOVELA_PAYMENT_LINKS[paymentKind]) {
        paymentLink = BIOVELA_PAYMENT_LINKS[paymentKind];
      } else {
        return NextResponse.json(
          { error: 'Tipo de pago Biovela no válido o link no configurado' },
          { status: 404 },
        );
      }
    } else {
      paymentLink = PAYMENT_LINKS[clientId];
      if (!paymentLink) {
        return NextResponse.json(
          { error: 'Plan no encontrado o link de pago no configurado' },
          { status: 404 },
        );
      }
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
      ...(prorateMx  !== undefined && { prorateMx }),
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
        ? `$${totalToday} MXN`
        : setupFee !== undefined
          ? `$${setupFee} MXN`
          : '—');
    const planLine = planName || clientId;
    const waMsg = [
      '🎉 NUEVO CONTRATO FIRMADO',
      `Cliente: ${signedName}`,
      `Plan: ${planLine}`,
      `Monto: ${montoLine}`,
      ...(prorateMx !== undefined ? [`Prorateo julio: $${prorateMx} MXN`] : []),
      `Fecha: ${hoy}`,
    ].join('\n');
    void trySendContractSignedWhatsApp(waMsg);

    if (signOnly) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ paymentLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[contratar/sign]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
