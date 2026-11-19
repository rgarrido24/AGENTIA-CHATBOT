// GET /api/facturacion/consultar/[uuid]
// Consulta estado y URLs de descarga de un CFDI

import { NextRequest, NextResponse } from 'next/server';
import { csplugConsultar } from '@/src/lib/facturacion/csplug-client';
import clientPromise from '@/lib/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const { uuid } = params;
  if (!uuid) {
    return NextResponse.json({ error: 'UUID requerido' }, { status: 400 });
  }

  try {
    // Consultar en CSPlug
    const result = await csplugConsultar(uuid);

    // También traer el registro local si existe
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const local = await db.collection('facturas').findOne({ uuid });

    return NextResponse.json({
      uuid,
      estado: result.estado,
      pdfUrl: result.pdfUrl || local?.pdfUrl,
      xmlUrl: result.xmlUrl || local?.xmlUrl,
      folio: local ? `${local.serie}-${local.folio}` : undefined,
      total: local?.total,
      receptor: local ? { rfc: local.receptorRFC, nombre: local.receptorNombre } : undefined,
      marca: local?.marca,
      fechaTimbrado: local?.fechaTimbrado,
    });
  } catch (err: unknown) {
    console.error('[facturacion/consultar]', err);
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
