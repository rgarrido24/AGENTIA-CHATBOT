import { NextResponse } from 'next/server';
import { registrarContacto } from '@/lib/sabucan-clientes';
import { getTenant } from '@/lib/wallet-tenant';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const cfg = getTenant(tenant);
    if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });

    const body = (await req.json()) as {
      telefono?: string;
      plantilla?: string;
      mensaje?: string;
    };

    const cliente = await registrarContacto(tenant, {
      telefono: String(body.telefono ?? ''),
      plantilla: String(body.plantilla ?? ''),
      mensaje: body.mensaje != null ? String(body.mensaje) : undefined,
    });

    return NextResponse.json({ ok: true, cliente });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar contacto';
    const status =
      msg.includes('inválid') || msg.includes('requerid') || msg.includes('no encontrado')
        ? 400
        : 500;
    if (status === 500) console.error('[api/loyalty/contacto]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
