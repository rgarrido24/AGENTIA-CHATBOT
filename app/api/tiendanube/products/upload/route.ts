import { NextRequest, NextResponse } from 'next/server';
import {
  createTiendanubeProduct,
  getCatalogForClient,
  getTiendanubeToken,
  sleep,
} from '@/lib/tiendanube';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId = typeof body.clientId === 'string' ? body.clientId.trim().toLowerCase() : '';
    if (!clientId) {
      return NextResponse.json({ error: 'clientId requerido' }, { status: 400 });
    }

    const tokenDoc = await getTiendanubeToken(clientId);
    if (!tokenDoc?.accessToken || !tokenDoc.storeId) {
      return NextResponse.json(
        { error: 'Tiendanube no conectado para este cliente. Instala la app primero.' },
        { status: 400 }
      );
    }

    const catalog = await getCatalogForClient(clientId);
    if (!catalog.length) {
      return NextResponse.json({ error: 'Catálogo vacío en business_configs' }, { status: 400 });
    }

    let uploaded = 0;
    let failed = 0;
    const errors: { name: string; error: string }[] = [];

    for (const product of catalog) {
      try {
        await createTiendanubeProduct(tokenDoc.storeId, tokenDoc.accessToken, product);
        uploaded += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: product.name,
          error: err instanceof Error ? err.message : 'upload_failed',
        });
      }
      await sleep(600);
    }

    return NextResponse.json({
      uploaded,
      failed,
      total: catalog.length,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al subir productos';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
