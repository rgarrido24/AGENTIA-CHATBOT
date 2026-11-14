import { NextResponse } from 'next/server';
import { procesarVencimientos } from '@/lib/lealtad-renovaciones';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Barrido diario de pruebas y suscripciones. Autenticación: `Authorization: Bearer CRON_SECRET` o `?secret=`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const ok =
    !!secret &&
    (req.headers.get('authorization') === `Bearer ${secret}` || new URL(req.url).searchParams.get('secret') === secret);
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await procesarVencimientos()) });
}
