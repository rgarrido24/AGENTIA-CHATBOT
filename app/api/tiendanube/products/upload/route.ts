import { NextRequest, NextResponse } from 'next/server';
import { getAppBaseUrl, getCatalogForClient, getTiendanubeToken } from '@/lib/tiendanube';
import { createUploadJob, runTiendanubeUploadJob } from '@/lib/tiendanube-upload-job';

export const dynamic = 'force-dynamic';

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
        { status: 400 },
      );
    }

    const catalog = await getCatalogForClient(clientId);
    if (!catalog.length) {
      return NextResponse.json({ error: 'Catálogo vacío en business_configs' }, { status: 400 });
    }

    const job = await createUploadJob(clientId, catalog.length);

    runTiendanubeUploadJob(job.jobId, clientId).catch((err) => {
      console.error('[tiendanube/upload]', job.jobId, err);
    });

    const baseUrl = getAppBaseUrl();
    return NextResponse.json(
      {
        jobId: job.jobId,
        status: job.status,
        total: job.total,
        statusUrl: `${baseUrl}/api/tiendanube/products/upload/${job.jobId}`,
      },
      { status: 202 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al iniciar subida';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
