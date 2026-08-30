import { NextRequest, NextResponse } from 'next/server';
import { getPublicCotizacionPdf } from '@/lib/cwf-cotizacion-public-pdf';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ token: string }> };

/** URL pública: /cotizaciones/{uuid}.pdf — sin autenticación (WhatsApp / clientes). */
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { token } = await ctx.params;
  const file = await getPublicCotizacionPdf(token);
  if (!file) {
    return NextResponse.json({ error: 'Cotización no encontrada o enlace expirado' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${file.fileName}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
