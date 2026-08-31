import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function hasCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  const q = req.nextUrl.searchParams.get('secret');
  return auth === `Bearer ${secret}` || q === secret;
}

/**
 * Seguimiento automático Biovela — desactivado (cliente dado de baja).
 * La ruta responde inerte por si un cron externo sigue llamándola.
 */
export async function GET(req: NextRequest) {
  if (!hasCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, disabled: true, clientId: 'biovela' });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
