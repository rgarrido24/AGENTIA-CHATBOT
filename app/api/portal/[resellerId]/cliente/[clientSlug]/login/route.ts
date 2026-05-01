import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import {
  hashClientPassword,
  buildClientCookieValue,
  CLIENT_COOKIE_NAME,
  CLIENT_COOKIE_MAX_AGE,
} from '@/lib/client-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
  const { resellerId, clientSlug } = params;
  const body     = await req.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!password) {
    return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
  }

  const db  = await getMongoDb();
  const doc = await db.collection('leads').findOne({
    _collection_type: 'reseller_client',
    resellerId,
    clientSlug,
  });

  if (!doc?.clientPasswordHash) {
    return NextResponse.json({ error: 'Acceso no habilitado para este cliente' }, { status: 401 });
  }

  const hash = hashClientPassword(password);
  if (hash !== String(doc.clientPasswordHash)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const cookieValue = buildClientCookieValue(resellerId, clientSlug, String(doc.clientPasswordHash));
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   CLIENT_COOKIE_MAX_AGE,
    path:     '/',
  });

  return NextResponse.json({ ok: true });
}
