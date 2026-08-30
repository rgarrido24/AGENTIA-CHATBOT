import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { renderCotizacionPdf } from '@/lib/cotizacion-pdf';
import { getCwfCotizacionByFolio } from '@/lib/cwf-cotizaciones-db';
import { publishCotizacionPdf } from '@/lib/cwf-cotizacion-public-pdf';

export const dynamic = 'force-dynamic';

/** Regenera PDF de una cotización guardada y publica link temporal. */
export async function POST(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const folio = String(body?.folio ?? '').trim();
  if (!folio) {
    return NextResponse.json({ error: 'folio requerido' }, { status: 400 });
  }

  const doc = await getCwfCotizacionByFolio(folio);
  if (!doc) {
    return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
  }

  const pdf = await renderCotizacionPdf(doc);
  const published = await publishCotizacionPdf({ folio, pdf });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${folio}.pdf"`,
      'X-Cotizacion-Folio': folio,
      'X-Cotizacion-Public-Url': published.publicUrl,
      'X-Cotizacion-Public-Expires': published.expiresAt.toISOString(),
    },
  });
}
