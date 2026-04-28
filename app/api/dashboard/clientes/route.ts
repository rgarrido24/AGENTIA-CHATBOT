import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const db = await getMongoDb();
  const clientes = await db
    .collection('agentia_clients')
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({ clientes });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !['activo', 'suspendido', 'cancelado'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const db = await getMongoDb();
  await db.collection('agentia_clients').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );
  return NextResponse.json({ ok: true });
}
