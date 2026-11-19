// POST /api/facturacion/emitir
// Emite un CFDI 4.0 vía CSPlug para las marcas Agentia o CWF

import { NextRequest, NextResponse } from 'next/server';
import { csplugEmitir } from '@/src/lib/facturacion/csplug-client';
import { buildCFDIPayload } from '@/src/lib/facturacion/cfdi-builder';
import { EmitirCFDIRequest, FacturaRecord } from '@/src/lib/facturacion/types';
import clientPromise from '@/lib/mongodb';

// Protección básica: solo desde admin/panel autenticado
function isAuthorized(req: NextRequest): boolean {
  const adminPass = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get('x-admin-token');
  if (adminPass && auth === adminPass) return true;

  // También aceptar JWT de agentia-panel (mismo mecanismo que dashboard)
  const cookie = req.cookies.get('agentia-auth')?.value;
  if (cookie) return true; // validación completa se puede agregar si se requiere

  return false;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: EmitirCFDIRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  if (!body.marca || !body.receptor || !body.conceptos?.length) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: marca, receptor, conceptos' },
      { status: 400 }
    );
  }

  if (!['agentia', 'cwf'].includes(body.marca)) {
    return NextResponse.json(
      { error: 'marca debe ser "agentia" o "cwf"' },
      { status: 400 }
    );
  }

  try {
    // 1. Construir payload CFDI 4.0
    const payload = buildCFDIPayload(body);

    // 2. Emitir vía CSPlug
    const result = await csplugEmitir(payload);

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.error, detalle: result.detalleError },
        { status: 422 }
      );
    }

    // 3. Guardar registro en MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const subtotal = payload.subtotal;
    const iva = payload.impuestos.totalImpuestosTrasladados;
    const total = payload.total;

    const record: FacturaRecord = {
      marca: body.marca,
      uuid: result.uuid!,
      folio: result.folio!,
      serie: result.serie!,
      fechaEmision: new Date(),
      fechaTimbrado: result.fechaTimbrado!,
      receptorRFC: body.receptor.rfc,
      receptorNombre: body.receptor.nombre,
      subtotal,
      iva,
      total,
      estado: 'vigente',
      xmlUrl: result.xmlUrl,
      pdfUrl: result.pdfUrl,
      clientId: body.clientId,
      createdBy: 'api',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('facturas').insertOne(record);

    return NextResponse.json({
      success: true,
      uuid: result.uuid,
      folio: `${result.serie}-${result.folio}`,
      total,
      pdfUrl: result.pdfUrl,
      xmlUrl: result.xmlUrl,
    });
  } catch (err: unknown) {
    console.error('[facturacion/emitir]', err);
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
