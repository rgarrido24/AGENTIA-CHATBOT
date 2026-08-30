import { NextRequest, NextResponse } from 'next/server';
import { addBookAppointment } from '@/src/lib/book-store';

type ServiceConfig = { name: string; duracionEstimada?: number };
type BusinessConfig = { capacidadSimultanea?: number; services?: ServiceConfig[] };

function getDuracion(servicio: string, config: BusinessConfig): number {
  const s = config.services?.find((x) => x.name.toLowerCase() === servicio.toLowerCase());
  return s?.duracionEstimada ?? 30;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const start: string = body.start;
    const serviceName: string = body.serviceName || 'Corte';
    const config: BusinessConfig = body.businessConfig ?? {};
    if (!start || typeof start !== 'string') {
      return NextResponse.json({ error: 'start (ISO) requerido' }, { status: 400 });
    }
    const durationMin = getDuracion(serviceName, config);
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
    const end = endDate.toISOString();
    addBookAppointment(start, end);
    return NextResponse.json({ ok: true, start, end });
  } catch (err) {
    console.error('[api/book/reserve]', err);
    return NextResponse.json({ error: 'Error al reservar' }, { status: 500 });
  }
}
