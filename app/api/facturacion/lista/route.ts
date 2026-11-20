// GET /api/facturacion/lista?marca=agentia&limit=20&page=1
// Lista facturas emitidas guardadas en MongoDB

import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const adminPass = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get('x-admin-token');
  const cookie = req.cookies.get('agentia-auth')?.value;

  if (adminPass && auth !== adminPass && !cookie) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const marca = searchParams.get('marca');     // 'agentia' | 'cwf' | null (todas)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
  const clientId = searchParams.get('clientId');

  const filter: Record<string, unknown> = {};
  if (marca) filter.marca = marca;
  if (clientId) filter.clientId = clientId;

  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB);
    const col = db.collection('facturas');

    const [items, total] = await Promise.all([
      col
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
