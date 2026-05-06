import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { listMergedAgentiaClients } from '@/lib/agentia-dashboard-clients';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const db = await getMongoDb();
  const clientes = await listMergedAgentiaClients(db);
  return NextResponse.json({ clientes });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !['activo', 'suspendido', 'cancelado'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const db = await getMongoDb();
  const oid = new ObjectId(id);
  let r = await db.collection('agentia_clients').updateOne(
    { _id: oid },
    { $set: { status, updatedAt: new Date() } }
  );
  if (r.matchedCount === 0) {
    r = await db.collection('agentia_clientes').updateOne(
      { _id: oid },
      { $set: { status, updatedAt: new Date() } }
    );
  }
  if (r.matchedCount === 0) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
