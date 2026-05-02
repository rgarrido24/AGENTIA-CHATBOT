import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const PAYMENT_LINKS: Record<string, string | undefined> = {
  luciano:   process.env.STRIPE_PAYMENT_LINK_LUCIANO,
  decohouse: process.env.STRIPE_PAYMENT_LINK_DECOHOUSE,
};

export async function POST(req: NextRequest) {
  try {
    const body       = await req.json().catch(() => ({}));
    const clientId   = typeof body.clientId   === 'string' ? body.clientId.trim()   : '';
    const signedName = typeof body.signedName === 'string' ? body.signedName.trim() : '';

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
      userAgent: req.headers.get('user-agent') ?? '',
      signedAt:  new Date(),
    });

    return NextResponse.json({ paymentLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[contratar/sign]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
