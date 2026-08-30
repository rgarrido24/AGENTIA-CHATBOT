import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLAN_DATA, type PlanKey, type Moneda } from '@/lib/stripe';

const PRICE_IDS: Record<PlanKey, Record<Moneda, string>> = {
  starter:     { mxn: process.env.STRIPE_PRICE_STARTER_MXN ?? '',     usd: process.env.STRIPE_PRICE_STARTER_USD ?? '' },
  profesional: { mxn: process.env.STRIPE_PRICE_PROFESIONAL_MXN ?? '', usd: process.env.STRIPE_PRICE_PROFESIONAL_USD ?? '' },
  premium:     { mxn: process.env.STRIPE_PRICE_PREMIUM_MXN ?? '',     usd: process.env.STRIPE_PRICE_PREMIUM_USD ?? '' },
};

const ACTIVACION_IDS: Record<Moneda, string> = {
  mxn: process.env.STRIPE_PRICE_ACTIVACION_MXN ?? '',
  usd: process.env.STRIPE_PRICE_ACTIVACION_USD ?? '',
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plan:    PlanKey = body.plan    in PLAN_DATA ? body.plan    : 'starter';
  const moneda:  Moneda  = body.moneda === 'usd'     ? 'usd'        : 'mxn';
  const negocio: string  = String(body.negocio  ?? '').trim();
  const nombre:  string  = String(body.nombre   ?? '').trim();
  const giro:    string  = String(body.giro     ?? '').trim();
  const pais:    string  = String(body.pais     ?? '').trim();
  const telefono:string  = String(body.telefono ?? '').trim();
  const email:   string  = String(body.email    ?? '').trim();

  const priceId     = PRICE_IDS[plan][moneda];
  const activaId    = ACTIVACION_IDS[moneda];
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agentia.software';

  // If price IDs not configured, use price_data fallback
  const planInfo = PLAN_DATA[plan];
  const precioEnCentavos = moneda === 'mxn'
    ? planInfo.precioMXN * 100
    : planInfo.precioUSD * 100;
  const activacionEnCentavos = moneda === 'mxn'
    ? planInfo.activacionMXN * 100
    : planInfo.activacionUSD * 100;

  const metadata = { plan, moneda, negocio, nombre, giro, pais, telefono, email };

  const lineItems = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [{
        price_data: {
          currency: moneda,
          product_data: { name: `Agentia ${planInfo.nombre}` },
          unit_amount: precioEnCentavos,
          recurring: { interval: 'month' as const },
        },
        quantity: 1,
      }];

  const addInvoiceItems = activaId
    ? [{ price: activaId }]
    : [{
        price_data: {
          currency: moneda,
          product_data: { name: 'Activación única Agentia' },
          unit_amount: activacionEnCentavos,
        },
      }];

  // In Checkout subscription mode, one-time prices go in line_items (charged on first invoice only)
  const allLineItems = [...lineItems, ...addInvoiceItems];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: allLineItems,
    subscription_data: {
      metadata,
    },
    customer_email: email || undefined,
    metadata,
    success_url: `${baseUrl}/bienvenida?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/precios`,
  });

  return NextResponse.json({ url: session.url });
}
