import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { peekNextCwfFolio, listCwfCotizaciones } from '@/lib/cwf-cotizaciones-db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const nextFolio = req.nextUrl.searchParams.get('nextFolio') === '1';
  const [cotizaciones, folio] = await Promise.all([
    listCwfCotizaciones(10),
    nextFolio ? peekNextCwfFolio() : Promise.resolve(null),
  ]);

  return NextResponse.json({
    cotizaciones: cotizaciones.map((c) => ({
      ...c,
      fecha: c.fecha.toISOString(),
      publicExpiresAt:
        c.publicExpiresAt instanceof Date
          ? c.publicExpiresAt.toISOString()
          : c.publicExpiresAt ?? null,
    })),
    nextFolio: folio,
  });
}
