import { NextRequest, NextResponse } from 'next/server';
import {
  findByPhone,
  listLoyaltyCustomers,
  redeemPoints,
  registerConsumption,
  upsertLoyaltyCustomer,
} from '@/lib/loyalty-customers-db';
import {
  DEMO_CUSTOMERS,
  LOYALTY_RESTAURANT_ID,
  handleWhatsAppCommand,
  type RedemptionId,
} from '@/lib/loyalty-restaurant';

export const dynamic = 'force-dynamic';

async function withDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error('[api/demos/loyalty]', e);
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const restauranteId = req.nextUrl.searchParams.get('restaurante_id') ?? LOYALTY_RESTAURANT_ID;
  const phone = req.nextUrl.searchParams.get('telefono');

  if (phone) {
    const customer = await withDb(() => findByPhone(phone, restauranteId), null);
    return NextResponse.json({ customer });
  }

  const customers = await withDb(() => listLoyaltyCustomers(restauranteId), DEMO_CUSTOMERS);
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const action = String(body.action ?? '');

  if (action === 'whatsapp') {
    const text = String(body.text ?? '');
    const phone = String(body.telefono ?? '');
    const customers = await withDb(() => listLoyaltyCustomers(), DEMO_CUSTOMERS);
    const customer = customers.find((c) => c.telefono === phone);
    const result = handleWhatsAppCommand(text, customer, phone);
    if (result.customer && result.isNew) {
      await withDb(() => upsertLoyaltyCustomer(result.customer!), result.customer!);
    }
    return NextResponse.json({ reply: result.reply, customer: result.customer ?? customer ?? null });
  }

  if (action === 'consumo') {
    const customerId = String(body.customerId ?? '');
    const monto = Number(body.monto);
    if (!customerId || !Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const customer = await withDb(() => registerConsumption(customerId, monto), null);
    if (!customer) {
      return NextResponse.json({ error: 'No se pudo registrar consumo' }, { status: 404 });
    }
    return NextResponse.json({ customer });
  }

  if (action === 'canje') {
    const customerId = String(body.customerId ?? '');
    const redemptionId = String(body.redemptionId ?? '') as RedemptionId;
    const result = await withDb(() => redeemPoints(customerId, redemptionId), {
      customer: null,
      error: 'MongoDB no disponible',
    });
    if (!result.customer) {
      return NextResponse.json({ error: result.error ?? 'Error al canjear' }, { status: 400 });
    }
    return NextResponse.json({ customer: result.customer });
  }

  if (action === 'sync') {
    const customers = body.customers;
    if (!Array.isArray(customers)) {
      return NextResponse.json({ error: 'customers requerido' }, { status: 400 });
    }
    for (const c of customers) {
      await withDb(() => upsertLoyaltyCustomer(c), c);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
}
