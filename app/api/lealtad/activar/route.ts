import { NextResponse } from 'next/server';
import { activarSolicitud } from '@/lib/lealtad-provision';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** POST { ref } con `Authorization: Bearer CRON_SECRET` — reintenta la activación de una solicitud pagada. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { ref } = (await req.json().catch(() => ({}))) as { ref?: string };
  if (!ref) return NextResponse.json({ error: 'ref requerido' }, { status: 400 });
  return NextResponse.json(await activarSolicitud(ref));
}
