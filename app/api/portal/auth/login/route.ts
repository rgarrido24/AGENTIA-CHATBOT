import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MongoClient } from 'mongodb';
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

  // Conexión fresca — bypassa el cliente cacheado de getMongoDb()
  const uri = process.env.MONGODB_URI!;
  const mongoClient = new MongoClient(uri);
  let reseller: Record<string, unknown> | null = null;
  try {
    await mongoClient.connect();
    const db = mongoClient.db('agentia_chatbot_ventas');

    const collections = await db.listCollections().toArray();
    console.log('[portal/login] colecciones:', collections.map((c) => c.name));

    const all = await db.collection('resellers').find({}).toArray();
    console.log('[portal/login] todos los docs en resellers:', JSON.stringify(all));

    reseller = await db.collection('resellers').findOne({ resellerId }) as Record<string, unknown> | null;
    console.log('[portal/login] reseller encontrado:', JSON.stringify(reseller));
  } finally {
    await mongoClient.close();
  }

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
