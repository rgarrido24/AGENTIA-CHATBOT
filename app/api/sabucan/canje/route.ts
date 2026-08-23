import { NextResponse } from 'next/server';
import { canjearPuntosSabucan } from '@/lib/sabucan-clientes';
import { syncSabucanWalletPuntos } from '@/lib/wallet-sabucan';
import { formatPuntos } from '@/lib/wallet-sabucan-points';

export const dynamic = 'force-dynamic';

/** POST /api/sabucan/canje — { telefono, puntos, skipWalletSync? } · 1 punto = $1 MXN */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      telefono?: string;
      puntos?: number;
      skipWalletSync?: boolean;
    };

    const result = await canjearPuntosSabucan(
      String(body.telefono ?? ''),
      Number(body.puntos),
    );

    // En flujo combinado caja (canje+venta) el sync lo hace la venta al final
    if (!body.skipWalletSync) {
      await syncSabucanWalletPuntos(result.cliente.id, result.cliente.puntos);
    }

    return NextResponse.json({
      ok: true,
      puntosCanjeados: result.puntosCanjeados,
      descuentoMxn: result.descuentoMxn,
      cliente: result.cliente,
      mensaje: `Canjeados ${formatPuntos(result.puntosCanjeados)} puntos = $${formatPuntos(result.descuentoMxn)} MXN de descuento. Saldo restante: ${formatPuntos(result.cliente.puntos)} puntos`,
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
    if (status === 500) console.error('[api/sabucan/canje]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
