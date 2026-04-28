import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const password = req.cookies.get('admin_auth')?.value;
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const db = await getMongoDb();
  const clientes = await db
    .collection('agentia_clients')
    .find({})
    .sort({ createdAt: -1 })
    .project({ negocio: 1, plan: 1, moneda: 1, proximoPago: 1, status: 1, stripeCustomerId: 1 })
    .toArray();
  return NextResponse.json({ clientes });
}
