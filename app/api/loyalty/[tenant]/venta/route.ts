import { NextResponse } from 'next/server';
import { registrarVenta } from '@/lib/sabucan-clientes';
import { syncWalletPuntosByObjectId } from '@/lib/wallet-sabucan';
import { formatPuntos } from '@/lib/wallet-sabucan-points';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';
import { tenantObjectId, tenantRecompensa } from '@/lib/wallet-tenant';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const cfg = await getLoyaltyTenant(tenant);
    if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });

    const body = (await req.json()) as {
      telefono?: string;
      monto?: number;
      nombre?: string;
      nombreCompleto?: string;
      fechaNacimiento?: string;
    };

    const result = await registrarVenta(tenant, {
      telefono: String(body.telefono ?? ''),
      monto: Number(body.monto),
      nombre: body.nombre != null ? String(body.nombre) : undefined,
      nombreCompleto: body.nombreCompleto != null ? String(body.nombreCompleto) : undefined,
      fechaNacimiento: body.fechaNacimiento != null ? String(body.fechaNacimiento) : undefined,
    });

    await syncWalletPuntosByObjectId(
      tenantObjectId(cfg, result.cliente.id),
      result.cliente.puntos,
      cfg,
    );

    const rec = tenantRecompensa(cfg);
    const mensaje =
      rec.modelo === 'sellos'
        ? `Visita registrada — +${Math.round(result.puntosGanados)} sello, total: ${Math.round(result.cliente.puntos)} sellos`
        : `Venta registrada — ${formatPuntos(result.puntosGanados)} puntos agregados, saldo total: ${formatPuntos(result.cliente.puntos)} puntos`;

    return NextResponse.json({
      ok: true,
      puntosGanados: result.puntosGanados,
      esNuevo: result.esNuevo,
      cliente: result.cliente,
      mensaje,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar venta';
    const status =
      msg.includes('inválid') || msg.includes('requerid') || msg.includes('Nombre') ? 400 : 500;
    if (status === 500) console.error('[api/loyalty/venta]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
