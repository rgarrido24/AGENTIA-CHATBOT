import { buildResellerManifest } from '@/lib/portal-pwa-config';
import { getMongoDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { resellerId: string } }) {
  let nombre = '';
  try {
    const db = await getMongoDb();
    const r = await db.collection('leads').findOne(
      { _collection_type: 'reseller', resellerId: params.resellerId },
      { projection: { brandName: 1, nombre: 1 } },
    );
    nombre = String(r?.brandName || r?.nombre || '');
  } catch { /* manifest genérico */ }

  return NextResponse.json(buildResellerManifest(params.resellerId, nombre), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
