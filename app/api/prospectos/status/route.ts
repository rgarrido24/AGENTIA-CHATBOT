import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, notas, asignadoA, lote } = body as {
      id: string;
      status?: string;
      notas?: string;
      asignadoA?: string;
      lote?: string;
    };

    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 });

    const db = await getMongoDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (notas !== undefined) updates.notas = notas;
    if (asignadoA !== undefined) updates.asignadoA = asignadoA;
    if (lote !== undefined) updates.lote = lote;

    await db.collection('prospectos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getMongoDb();

    // Borrado masivo vía body JSON
    let body: { ids?: string[]; deleteAll?: boolean; lote?: string } = {};
    try { body = await request.json(); } catch { /* ignorar si no hay body */ }

    if (body.deleteAll) {
      // Borrar todos (con filtro de lote opcional)
      const filter = body.lote ? { lote: body.lote } : {};
      const result = await db.collection('prospectos').deleteMany(filter);
      return NextResponse.json({ ok: true, deleted: result.deletedCount });
    }

    if (body.ids?.length) {
      // Borrar lista de IDs
      const oids = body.ids.map((id) => new ObjectId(id));
      const result = await db.collection('prospectos').deleteMany({ _id: { $in: oids } });
      return NextResponse.json({ ok: true, deleted: result.deletedCount });
    }

    // Borrado individual por query param (compatibilidad)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id, ids o deleteAll requerido' }, { status: 400 });
    await db.collection('prospectos').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true, deleted: 1 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
