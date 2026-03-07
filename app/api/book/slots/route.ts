import { NextRequest, NextResponse } from 'next/server';
import { isSlotAvailable, type SlotRange } from '@/src/lib/availability';

type ServiceConfig = { name: string; duracionEstimada?: number };
type BusinessConfig = { capacidadSimultanea?: number; services?: ServiceConfig[] };

function getDuracion(servicio: string, config: BusinessConfig): number {
  const s = config.services?.find((x) => x.name.toLowerCase() === servicio.toLowerCase());
  return s?.duracionEstimada ?? 30;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const existingEvents: SlotRange[] = Array.isArray(body.existingEvents) ? body.existingEvents : [];
    const config: BusinessConfig = body.businessConfig ?? {};
    const capacidad = Math.max(1, Number(config.capacidadSimultanea) || 1);
    const dateIso = typeof body.dateIso === 'string' ? body.dateIso : '';
    const serviceName = typeof body.serviceName === 'string' ? body.serviceName : 'Corte';
    if (!dateIso) {
      return NextResponse.json({ error: 'dateIso requerido' }, { status: 400 });
    }
    const durationMin = getDuracion(serviceName, config);
    const dayStart = new Date(dateIso);
    dayStart.setUTCHours(9, 0, 0, 0);
    const slots: string[] = [];
    const step = 15;
    for (let min = 9 * 60; min + durationMin <= 20 * 60; min += step) {
      const start = new Date(dayStart);
      start.setUTCHours(Math.floor(min / 60), min % 60, 0, 0);
      const startIso = start.toISOString();
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      const endIso = end.toISOString();
      if (isSlotAvailable(existingEvents, startIso, endIso, capacidad)) {
        slots.push(startIso);
      }
    }
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('[api/book/slots]', err);
    return NextResponse.json({ error: 'Error al calcular slots' }, { status: 500 });
  }
}
