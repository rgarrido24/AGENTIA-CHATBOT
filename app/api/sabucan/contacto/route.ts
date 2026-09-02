import { NextResponse } from 'next/server';
import { registrarContacto } from '@/lib/sabucan-clientes';

export const dynamic = 'force-dynamic';

/** POST /api/sabucan/contacto — { telefono, plantilla, mensaje? } · deja constancia de un contacto de reactivación */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      telefono?: string;
      plantilla?: string;
      mensaje?: string;
    };

    const cliente = await registrarContacto('sabucan', {
      telefono: String(body.telefono ?? ''),
      plantilla: String(body.plantilla ?? ''),
      mensaje: body.mensaje != null ? String(body.mensaje) : undefined,
    });

    return NextResponse.json({ ok: true, cliente });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar contacto';
    const status =
      msg.includes('inválid') || msg.includes('requerid') || msg.includes('no encontrado')
        ? 400
        : 500;
    if (status === 500) console.error('[api/sabucan/contacto]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
