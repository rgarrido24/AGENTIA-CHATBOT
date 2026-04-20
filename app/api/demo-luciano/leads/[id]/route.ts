import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';

const ESTADOS = ['nuevo', 'contactado', 'en_seguimiento', 'cerrado'] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { estado } = await req.json();
    if (!ESTADOS.includes(estado)) {
      return NextResponse.json({ ok: false, error: 'Estado inválido' }, { status: 400 });
    }
    const db = await getMongoDb();
    await db.collection('demo_luciano_leads').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { estado } }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
