import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const PAYMENT_LINKS: Record<string, string | undefined> = {
  luciano:   process.env.STRIPE_PAYMENT_LINK_LUCIANO,
  decohouse: process.env.STRIPE_PAYMENT_LINK_DECOHOUSE,
};

const ALLOWED_DOMAINS = ['agentia.software', 'localhost:3000', 'localhost:3010'];

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
      ip,
      userAgent:            req.headers.get('user-agent') ?? '',
      signedAt:             new Date(),
      ...(setupFee   !== undefined && { setupFee }),
      ...(totalToday !== undefined && { totalToday }),
      ...(renewalDate !== undefined && { renewalDate }),
    });

    return NextResponse.json({ paymentLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[contratar/sign]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
