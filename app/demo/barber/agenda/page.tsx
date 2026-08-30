'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getStoredConfig, getDefaultConfig, getDuracionMinutos } from '@/src/lib/demo-config';
import type { DemoBusinessConfig } from '@/src/lib/demo-config';
import type { CalendarEvent } from '@/app/demo/barber/CalendarDemo';
import type { CitaData } from '@/app/demo/barber/barber-chat-types';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

const CalendarDemo = dynamic(() => import('@/app/demo/barber/CalendarDemo'), { ssr: false });

const COLOR_ESTETICA = '#8b5cf6';
const COLOR_UÑAS = '#ec4899';
const COLOR_INFANTIL = '#f97316';
const COLOR_BARBERIA = '#0d9488';

function getEventColor(tipoNegocio: string, accentDefault: string): string {
  const t = (tipoNegocio || '').toLowerCase();
  if (t.includes('uña') || t.includes('unas') || t.includes('nail')) return COLOR_UÑAS;
  if (t.includes('estética') || t.includes('estetica')) return COLOR_ESTETICA;
  if (t.includes('infantil')) return COLOR_INFANTIL;
  if (t.includes('barber')) return COLOR_BARBERIA;
  return accentDefault;
}

export default function AgendaPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;

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

  const addEvent = useCallback(
    (cita: CitaData) => {
      const cfgLocal = getStoredConfig() ?? getDefaultConfig();
      const durationMin = getDuracionMinutos(cita.servicio, cfgLocal);
      const start = new Date(cita.fechaHora);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      const id = `cita-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const color = getEventColor(cita.tipoNegocio, accent);
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
    },
    [accent]
  );

  // Theme tokens
  const text = isNail ? 'text-zinc-900' : 'text-white';
  const textMuted = isNail ? 'text-zinc-600' : 'text-slate-300';
  const containerBorder = isNail ? 'border-pink-200' : 'border-white/10';
  const containerBg = isNail ? 'bg-white' : 'bg-white/5';

  return (
    <div className="p-2 sm:p-4">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className={`text-2xl font-bold ${text}`}>Agenda de citas</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Vista semanal — {isNail ? 'sesiones programadas en Nail Studio' : 'citas programadas en la barbería'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full font-semibold border`}
            style={{ background: `${accent}20`, color: accent, borderColor: `${accent}55` }}
          >
            {isNail ? 'Tema claro · acento rosa' : 'Tema oscuro · acento teal'}
          </span>
        </div>
      </div>

      <div
        className={`rounded-2xl border overflow-hidden min-h-[420px] h-[calc(100vh-12rem)] ${containerBorder} ${containerBg}`}
      >
        <CalendarDemo
          events={events}
          paidIds={paidIds}
          lastAddedEventId={lastAddedEventId}
          config={config}
          onEventAdded={addEvent}
          light={isNail}
        />
      </div>
    </div>
  );
}
