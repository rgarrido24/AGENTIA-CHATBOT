import { NextResponse } from 'next/server';
import { resetClientesCollection } from '@/lib/sabucan-clientes';
import { getTenant } from '@/lib/wallet-tenant';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

/** POST — borra todos los clientes del tenant demo (solo demos). */
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const cfg = getTenant(tenant);
    if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
    if (!cfg.isDemo) {
      return NextResponse.json({ error: 'Solo demos se pueden reiniciar' }, { status: 403 });
    }
    const deleted = await resetClientesCollection(tenant);
    return NextResponse.json({ ok: true, deleted, collection: cfg.collection });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al reiniciar';
    console.error('[api/loyalty/reset]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
