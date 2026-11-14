import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { requireTenantApi } from '@/lib/loyalty-session';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';
import { ENLACES_VACIOS, limpiarEnlaces } from '@/lib/lealtad-enlaces';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { tenant } = await ctx.params;
  const denied = await requireTenantApi(tenant);
  if (denied) return denied;
  const cfg = await getLoyaltyTenant(tenant);
  if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
  const doc = await (await getMongoDb()).collection('loyalty_tenants').findOne({ key: cfg.id });
  return NextResponse.json({ enlaces: { ...ENLACES_VACIOS, ...((doc?.enlaces as object) ?? {}) } });
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const denied = await requireTenantApi(tenant);
    if (denied) return denied;
    const cfg = await getLoyaltyTenant(tenant);
    if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const enlaces = limpiarEnlaces(body);
    await (await getMongoDb()).collection('loyalty_tenants').updateOne({ key: cfg.id }, { $set: { enlaces } });
    return NextResponse.json({ ok: true, enlaces });
  } catch (e) {
    console.error('[api/loyalty/enlaces]', e);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}
