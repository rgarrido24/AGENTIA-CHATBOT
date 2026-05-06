import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { listMergedAgentiaClients } from '@/lib/agentia-dashboard-clients';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const password = req.cookies.get('admin_auth')?.value;
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const db = await getMongoDb();
  const clientes = await listMergedAgentiaClients(db, {
    projection: {
      negocio: 1,
      plan: 1,
      moneda: 1,
      proximoPago: 1,
      status: 1,
      stripeCustomerId: 1,
      clientId: 1,
      createdAt: 1,
    },
  });
  return NextResponse.json({ clientes });
}
