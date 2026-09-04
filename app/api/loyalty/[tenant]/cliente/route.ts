import { NextRequest, NextResponse } from 'next/server';
import {
  findClienteByTelefono,
  normalizeSabucanTelefono,
} from '@/lib/sabucan-clientes';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    if (!(await getLoyaltyTenant(tenant))) {
      return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
    }
    const telefono = normalizeSabucanTelefono(req.nextUrl.searchParams.get('telefono') ?? '');
    if (telefono.length < 10) {
      return NextResponse.json({ error: 'Teléfono inválido (mínimo 10 dígitos)' }, { status: 400 });
    }
    const cliente = await findClienteByTelefono(tenant, telefono);
    return NextResponse.json({ found: Boolean(cliente), telefono, cliente });
  } catch (e) {
    console.error('[api/loyalty/cliente]', e);
    return NextResponse.json({ error: 'Error al buscar cliente' }, { status: 500 });
  }
}
