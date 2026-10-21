import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { isAddonEnabled } from '@/lib/client-addons';

/** Solo el revendedor (quien arma los formularios) y con el add-on `forms` activo en ese cliente. */
export async function authFormsRoute(
  req: NextRequest,
  { resellerId, clientSlug }: { resellerId: string; clientSlug: string },
): Promise<{ error: NextResponse } | { error: null }> {
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!reseller || reseller.resellerId !== resellerId) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1 } },
  );
  if (!client) return { error: NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 }) };
  if (!isAddonEnabled(client, 'forms')) {
    return { error: NextResponse.json({ error: 'El add-on de formularios no está activo para este cliente' }, { status: 403 }) };
  }
  return { error: null };
}
