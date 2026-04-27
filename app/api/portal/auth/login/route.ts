import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hashPassword, buildCookieValue, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/reseller-auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resellerId = typeof body?.resellerId === 'string' ? body.resellerId.trim() : '';
  const password   = typeof body?.password   === 'string' ? body.password          : '';

  if (!resellerId || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  console.log('[portal/login] MONGODB_URI:', process.env.MONGODB_URI?.slice(0, 30));
  console.log('[portal/login] MONGODB_DB:', process.env.MONGODB_DB);
  console.log('[portal/login] buscando resellerId:', resellerId);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MongoClient: MC } = require('mongodb');
  const uri = process.env.MONGODB_URI;
  const mc = new MC(uri);
  await mc.connect();
  const db = mc.db('agentia_chatbot_ventas');

  const total = await db.collection('leads').countDocuments();
  console.log('[portal/login] total docs en leads:', total);

  const sample = await db.collection('leads').find({}).sort({ _id: -1 }).limit(5).toArray();
  console.log('[portal/login] ultimos 5 docs:', JSON.stringify(sample.map((d: Record<string, unknown>) => ({ id: (d._id as { toString(): string }).toString(), resellerId: d.resellerId, type: d._collection_type, nombre: d.nombre }))));

  const reseller: Record<string, unknown> | null = await db.collection('leads').findOne({ resellerId });
  console.log('[portal/login] reseller sin filtro:', JSON.stringify(reseller));
  await mc.close();

  if (!reseller || reseller.status !== 'activo') {
    console.log('[portal/login] fallo: reseller nulo o status !== activo, status=', reseller?.status);
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const hash = hashPassword(password);
  console.log('[portal/login] hash recibido:', hash);
  console.log('[portal/login] hash en DB:   ', reseller.passwordHash);

  if (hash !== reseller.passwordHash) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const cookieValue = buildCookieValue(resellerId, reseller.passwordHash as string);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ ok: true, redirect: `/portal/${resellerId}/dashboard` });
}
