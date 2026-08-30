import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const VENTAS_DB = 'agentia_chatbot_ventas';
const DASHBOARD_COOKIE = 'dashboard_auth';
const AUTH_SALT = 'agentia_dashboard_v2';

function dashboardToken(): string {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(user + ':' + pass + AUTH_SALT).digest('hex');
}

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(DASHBOARD_COOKIE)?.value;
  return !!token && token === dashboardToken();
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI no configurada' }, { status: 500 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(VENTAS_DB);
    const clientes = await db
      .collection('agentia_clients')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    console.log('[clientes] total encontrados:', clientes.length);
    return NextResponse.json({ clientes });
  } catch (err) {
    console.error('[clientes] error MongoDB:', err);
    return NextResponse.json({ error: 'Error al consultar clientes' }, { status: 500 });
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
  try {
    await client.connect();
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
  } catch (err) {
    console.error('[clientes] error PATCH MongoDB:', err);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  } finally {
    await client.close();
  }
}
