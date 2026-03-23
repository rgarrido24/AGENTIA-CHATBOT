'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getStoredConfig, getDefaultConfig, getDuracionMinutos } from '@/src/lib/demo-config';
import type { DemoBusinessConfig } from '@/src/lib/demo-config';
import type { CalendarEvent } from '@/app/demo/barber/CalendarDemo';
import type { CitaData } from '@/app/demo/barber/barber-chat-types';

const CalendarDemo = dynamic(() => import('@/app/demo/barber/CalendarDemo'), { ssr: false });

const COLOR_ESTETICA = '#8b5cf6';
const COLOR_UÑAS = '#06b6d4';
const COLOR_INFANTIL = '#f97316';
const COLOR_BARBERIA = '#0d9488';

function getEventColor(tipoNegocio: string): string {
  const t = (tipoNegocio || '').toLowerCase();
  if (t.includes('uña') || t.includes('unas')) return COLOR_UÑAS;
  if (t.includes('estética') || t.includes('estetica')) return COLOR_ESTETICA;
  if (t.includes('infantil')) return COLOR_INFANTIL;
  if (t.includes('barber')) return COLOR_BARBERIA;
  return '#64748b';
}

export default function AgendaPage() {
  const [config, setConfig] = useState<DemoBusinessConfig>(() => getDefaultConfig());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [paidIds] = useState<Set<string>>(() => new Set());
  const [lastAddedEventId, setLastAddedEventId] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getStoredConfig() ?? getDefaultConfig());
  }, []);

  useEffect(() => {
    if (!lastAddedEventId) return;
    const t = setTimeout(() => setLastAddedEventId(null), 2500);
    return () => clearTimeout(t);
  }, [lastAddedEventId]);

  const addEvent = useCallback((cita: CitaData) => {
    const cfg = getStoredConfig() ?? getDefaultConfig();
    const durationMin = getDuracionMinutos(cita.servicio, cfg);
    const start = new Date(cita.fechaHora);
    const end = new Date(start.getTime() + durationMin * 60 * 1000);
    const id = `cita-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const color = getEventColor(cita.tipoNegocio);
    setEvents((prev) => [
      ...prev,
      {
        id,
        title: `${cita.clienteNombre} - ${cita.servicio}`,
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: color,
        borderColor: color,
        extendedProps: { tipoNegocio: cita.tipoNegocio, statusPago: 'pendiente', citaId: id },
      },
    ]);
    setLastAddedEventId(id);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agenda de citas</h1>
        <p className="text-slate-400 text-sm mt-1">Vista semanal de todas las citas programadas</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden min-h-[420px] h-[calc(100vh-12rem)]">
        <CalendarDemo
          events={events}
          paidIds={paidIds}
          lastAddedEventId={lastAddedEventId}
          config={config}
          onEventAdded={addEvent}
        />
      </div>
    </div>
  );
}
