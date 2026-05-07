import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

const VENTAS_DB = 'agentia_chatbot_ventas';

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI no configurada' }, { status: 500 });
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(VENTAS_DB);
    const clientes = await db
      .collection('agentia_clients')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ clientes });
  } finally {
    await client.close();
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !['activo', 'suspendido', 'cancelado'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI no configurada' }, { status: 500 });
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(VENTAS_DB);
    const oid = new ObjectId(id);
    let r = await db.collection('agentia_clients').updateOne(
      { _id: oid },
      { $set: { status, updatedAt: new Date() } },
    );
    if (r.matchedCount === 0) {
      r = await db.collection('agentia_clientes').updateOne(
        { _id: oid },
        { $set: { status, updatedAt: new Date() } },
      );
    }
    if (r.matchedCount === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } finally {
    await client.close();
  }
}
