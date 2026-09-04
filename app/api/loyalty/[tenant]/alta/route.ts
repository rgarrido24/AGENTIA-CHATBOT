import { NextResponse } from 'next/server';
import { altaCliente } from '@/lib/sabucan-clientes';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    if (!(await getLoyaltyTenant(tenant))) {
      return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });
    }

    const body = (await req.json()) as {
      telefono?: string;
      nombre?: string;
      nombreCompleto?: string;
      fechaNacimiento?: string;
    };

    const result = await altaCliente(tenant, {
      telefono: String(body.telefono ?? ''),
      nombreCompleto: String(body.nombreCompleto ?? body.nombre ?? ''),
      fechaNacimiento: String(body.fechaNacimiento ?? ''),
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al dar de alta';
    const status = msg.includes('Teléfono') || msg.includes('Nombre') || msg.includes('Fecha') ? 400 : 500;
    if (status === 500) console.error('[api/loyalty/alta]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}

