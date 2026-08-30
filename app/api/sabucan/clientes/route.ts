import { NextResponse } from 'next/server';
import { listSabucanClientes } from '@/lib/sabucan-clientes';

export const dynamic = 'force-dynamic';

/** GET /api/sabucan/clientes — lista completa ordenada por inactividad (más días primero) */
export async function GET() {
  try {
    const clientes = await listSabucanClientes();
    return NextResponse.json({ clientes });
  } catch (e) {
    console.error('[api/sabucan/clientes]', e);
    return NextResponse.json({ error: 'Error al listar clientes' }, { status: 500 });
  }
}
