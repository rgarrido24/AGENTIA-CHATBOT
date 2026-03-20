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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 });
    const db = await getMongoDb();
    await db.collection('prospectos').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
