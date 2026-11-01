import { buildPortalManifest } from '@/lib/portal-pwa-config';
import { getMongoDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  // El nombre de la app es el del cliente, para poder tener varias instaladas y distinguirlas.
  let nombre = '';
  try {
    const db = await getMongoDb();
    const c = await db.collection('leads').findOne(
      { _collection_type: 'reseller_client', resellerId: params.resellerId, clientSlug: params.clientSlug },
      { projection: { nombre: 1 } },
    );
    nombre = c?.nombre ? String(c.nombre) : '';
  } catch { /* sin nombre: manifest genérico */ }

  const manifest = buildPortalManifest(params.resellerId, params.clientSlug, nombre);

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
