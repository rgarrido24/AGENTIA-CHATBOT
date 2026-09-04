import { NextResponse } from 'next/server';
import { canjearPuntos } from '@/lib/sabucan-clientes';
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
      puntos?: number;
      skipWalletSync?: boolean;
    };

    const result = await canjearPuntos(
      tenant,
      String(body.telefono ?? ''),
      Number(body.puntos),
    );

    if (!body.skipWalletSync) {
      await syncWalletPuntosByObjectId(
        tenantObjectId(cfg, result.cliente.id),
        result.cliente.puntos,
        cfg,
      );
    }

    const rec = tenantRecompensa(cfg);
    const mensaje =
      rec.modelo === 'sellos'
        ? `Canjeados ${Math.round(result.puntosCanjeados)} sellos. Quedan ${Math.round(result.cliente.puntos)}`
        : `Canjeados ${formatPuntos(result.puntosCanjeados)} puntos = $${formatPuntos(result.descuentoMxn)} MXN. Saldo: ${formatPuntos(result.cliente.puntos)}`;

    return NextResponse.json({
      ok: true,
      puntosCanjeados: result.puntosCanjeados,
      descuentoMxn: rec.modelo === 'sellos' ? 0 : result.descuentoMxn,
      cliente: result.cliente,
      mensaje,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al canjear puntos';
    const status =
      msg.includes('inválid') ||
      msg.includes('insuficiente') ||
      msg.includes('no encontrado') ||
      msg.includes('Cantidad')
        ? 400
        : 500;
    if (status === 500) console.error('[api/loyalty/canje]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
