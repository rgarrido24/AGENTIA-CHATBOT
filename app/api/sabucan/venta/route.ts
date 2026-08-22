import { NextResponse } from 'next/server';
import { registrarVentaSabucan } from '@/lib/sabucan-clientes';
import { syncSabucanWalletPuntos } from '@/lib/wallet-sabucan';

export const dynamic = 'force-dynamic';

/** POST /api/sabucan/venta — { telefono, monto, nombre? } */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      telefono?: string;
      monto?: number;
      nombre?: string;
    };

    const result = await registrarVentaSabucan({
      telefono: String(body.telefono ?? ''),
      monto: Number(body.monto),
      nombre: body.nombre != null ? String(body.nombre) : undefined,
    });

    // Extra: sync pase Wallet si existe; no bloquea ni falla la venta
    await syncSabucanWalletPuntos(result.cliente.id, result.cliente.puntos);

    return NextResponse.json({
      ok: true,
      puntosGanados: result.puntosGanados,
      esNuevo: result.esNuevo,
      cliente: result.cliente,
      mensaje: `Venta registrada — ${result.puntosGanados} puntos agregados, saldo total: ${result.cliente.puntos} puntos`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar venta';
    const status =
      msg.includes('inválido') || msg.includes('requerido') || msg.includes('Nombre') ? 400 : 500;
    if (status === 500) console.error('[api/sabucan/venta]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
