import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { invalidateLoyaltyTenantCache } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

/**
 * Protegida por el login de /admin (middleware).
 * POST { key, accion }:
 *  - 'ocultar'  → desactivado total: 404 en panel, registro público, link y APIs (datos intactos)
 *  - 'mostrar'  → vuelve a ser visible, sigue suspendido (pantalla "Servicio suspendido" + reactivar)
 *  - 'activar'  → abierto y operando
 */
export async function POST(req: Request) {
  const { key, accion } = (await req.json().catch(() => ({}))) as { key?: string; accion?: string };
  const k = String(key ?? '').trim();
  if (!k || !['ocultar', 'mostrar', 'activar'].includes(String(accion))) {
    return NextResponse.json({ error: 'key y accion (ocultar|mostrar|activar) requeridos' }, { status: 400 });
  }
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (accion === 'ocultar') Object.assign(set, { desactivadoTotal: true, panelActivo: false });
  if (accion === 'mostrar') Object.assign(set, { desactivadoTotal: false });
  if (accion === 'activar') Object.assign(set, { desactivadoTotal: false, panelActivo: true });
  const r = await (await getMongoDb()).collection('loyalty_tenants').updateOne({ key: k }, { $set: set });
  if (r.matchedCount === 0) return NextResponse.json({ error: `No existe el negocio "${k}"` }, { status: 404 });
  invalidateLoyaltyTenantCache(k);
  return NextResponse.json({ ok: true, key: k, accion });
}
