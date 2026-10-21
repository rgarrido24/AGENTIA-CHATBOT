import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { isAddonEnabled } from '@/lib/client-addons';
import { getWaAccountByClient, type WaAccountDoc } from '@/lib/wa-accounts';

export type WaRouteCtx = { params: { resellerId: string; clientSlug: string } };

/**
 * Autoriza una ruta del add-on de WhatsApp: sesión del reseller, cliente existente y add-on activo.
 * Con requireAccount=true exige además un número ya conectado.
 */
export async function authWaRoute(
  req: NextRequest,
  { resellerId, clientSlug }: WaRouteCtx['params'],
  requireAccount = false,
): Promise<{ error: NextResponse } | { error: null; account: WaAccountDoc | null }> {
  // Acceso del revendedor (Luciano) o del propio cliente con su usuario (p. ej. Verónica).
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  const isReseller = !!reseller && reseller.resellerId === resellerId;
  const isClient = !isReseller && (await verifyClientCookie(req.cookies.get(CLIENT_COOKIE_NAME)?.value, resellerId, clientSlug));
  if (!isReseller && !isClient) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1 } },
  );
  if (!client) return { error: NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 }) };
  if (!isAddonEnabled(client, 'whatsappApi')) {
    return { error: NextResponse.json({ error: 'El add-on de API de WhatsApp no está activo para este cliente' }, { status: 403 }) };
  }
  const account = await getWaAccountByClient(resellerId, clientSlug);
  if (requireAccount && (!account || account.status === 'error' && !account.subscribed)) {
    return { error: NextResponse.json({ error: 'Este cliente aún no tiene un número de WhatsApp conectado' }, { status: 409 }) };
  }
  return { error: null, account };
}
