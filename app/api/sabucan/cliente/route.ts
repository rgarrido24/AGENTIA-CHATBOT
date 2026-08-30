import { NextRequest, NextResponse } from 'next/server';
import { findSabucanByTelefono, normalizeSabucanTelefono } from '@/lib/sabucan-clientes';

export const dynamic = 'force-dynamic';

/** GET /api/sabucan/cliente?telefono=9991234567 */
export async function GET(req: NextRequest) {
  try {
    const telefono = normalizeSabucanTelefono(req.nextUrl.searchParams.get('telefono') ?? '');
    if (telefono.length < 10) {
      return NextResponse.json({ error: 'Teléfono inválido (mínimo 10 dígitos)' }, { status: 400 });
    }
    const cliente = await findSabucanByTelefono(telefono);
    return NextResponse.json({
      found: Boolean(cliente),
      telefono,
      cliente,
    });
  } catch (e) {
    console.error('[api/sabucan/cliente]', e);
    return NextResponse.json({ error: 'Error al buscar cliente' }, { status: 500 });
  }
}
