import { NextResponse } from 'next/server';
import { listClientes } from '@/lib/sabucan-clientes';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    if (!(await getLoyaltyTenant(tenant))) {
      return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
    }
    const clientes = await listClientes(tenant);
    return NextResponse.json({ clientes });
  } catch (e) {
    console.error('[api/loyalty/clientes]', e);
    return NextResponse.json({ error: 'Error al listar clientes' }, { status: 500 });
  }
}
