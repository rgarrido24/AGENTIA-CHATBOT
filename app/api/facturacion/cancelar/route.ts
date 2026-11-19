// POST /api/facturacion/cancelar
// Cancela un CFDI ante el SAT vía CSPlug

import { NextRequest, NextResponse } from 'next/server';
import { csplugCancelar } from '@/src/lib/facturacion/csplug-client';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  const adminPass = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get('x-admin-token');
  if (adminPass && auth !== adminPass) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { uuid, motivo, uuidSustitucion } = await req.json();

  if (!uuid) {
    return NextResponse.json({ error: 'uuid requerido' }, { status: 400 });
  }

  const motivoValido = ['01', '02', '03', '04'].includes(motivo) ? motivo : '02';

  try {
    const result = await csplugCancelar(uuid, motivoValido, uuidSustitucion);

    if (result.status === 'success') {
      // Actualizar estado en MongoDB
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      await db.collection('facturas').updateOne(
        { uuid },
        { $set: { estado: 'cancelado', updatedAt: new Date() } }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[facturacion/cancelar]', err);
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
