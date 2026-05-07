import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { listMergedAgentiaClients } from '@/lib/agentia-dashboard-clients';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const DASHBOARD_COOKIE = 'dashboard_auth';
const AUTH_SALT = 'agentia_dashboard_v2';

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(DASHBOARD_COOKIE)?.value;
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';
  const expected = crypto.createHash('sha256').update(user + ':' + pass + AUTH_SALT).digest('hex');
  return !!token && token === expected;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
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
