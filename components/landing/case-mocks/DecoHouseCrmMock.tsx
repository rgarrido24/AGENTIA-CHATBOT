'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

const BRAND = {
  bg: '#071414',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.10)',
  accent: '#4fc3f7',
} as const;

const STAGES = [
  'Nuevo',
  'En seguimiento',
  'Visita técnico',
  'Anticipo 50%',
  'Contra entrega',
  'Cerrado',
] as const;

type FakeLead = {
  id: string;
  name: string;
  msg: string;
  paused: boolean;
  platform: string;
  time: string;
};

const FAKE_BY_STAGE: Record<(typeof STAGES)[number], FakeLead[]> = {
  Nuevo: [
    {
      id: 'dh-1',
      name: 'María González',
      msg: '¿Cotización vidrio templado 2×1 m?',
      paused: false,
      platform: 'whatsapp',
      time: '09 jul, 10:24',
    },
  ],
  'En seguimiento': [
    {
      id: 'dh-2',
      name: 'Carlos Ruiz',
      msg: 'Envió medidas del vano principal',
      paused: false,
      platform: 'whatsapp',
      time: '08 jul, 16:10',
    },
    {
      id: 'dh-3',
      name: 'Paula Soto',
      msg: 'Pregunta por perfil negro mate',
      paused: true,
      platform: 'instagram',
      time: '08 jul, 11:02',
    },
  ],
  'Visita técnico': [
    {
      id: 'dh-4',
      name: 'Ana Martínez',
      msg: 'Visita agendada — Las Condes',
      paused: true,
      platform: 'whatsapp',
      time: '07 jul, 09:45',
    },
  ],
  'Anticipo 50%': [
    {
      id: 'dh-5',
      name: 'Diego Fernández',
      msg: 'Transferencia comprobante adjunto',
      paused: true,
      platform: 'whatsapp',
      time: '06 jul, 14:30',
    },
  ],
  'Contra entrega': [
    {
      id: 'dh-6',
      name: 'Lucía Herrera',
      msg: 'Instalación programada viernes',
      paused: true,
      platform: 'whatsapp',
      time: '05 jul, 08:15',
    },
  ],
  Cerrado: [
    {
      id: 'dh-7',
      name: 'Pedro Sánchez',
      msg: 'Proyecto entregado — 5 estrellas',
      paused: true,
      platform: 'whatsapp',
      time: '01 jul, 17:00',
    },
  ],
};

export function DecoHouseCrmMock() {
  const [selectedId, setSelectedId] = useState('dh-4');
  const allLeads = STAGES.flatMap((s) => FAKE_BY_STAGE[s]);
  const selected = allLeads.find((l) => l.id === selectedId) ?? allLeads[0];
  const selectedStage =
    STAGES.find((s) => FAKE_BY_STAGE[s].some((l) => l.id === selectedId)) ?? 'Nuevo';

  return (
    <div
      className="mt-6 overflow-hidden rounded-2xl border text-white"
      style={{ background: BRAND.bg, borderColor: BRAND.border }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: BRAND.border }}>
        <p className="text-xs text-white/55">Deco House</p>
        <h4 className="text-base font-bold">Pipeline + Presupuestos</h4>
        <p className="mt-0.5 text-[11px] text-white/45">
          Simulación del panel · datos ficticios
        </p>
      </div>

      <div className="overflow-x-auto p-3">
        <div className="flex min-w-[720px] gap-2">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="w-[120px] shrink-0 overflow-hidden rounded-xl"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="border-b px-2 py-2" style={{ borderColor: BRAND.border }}>
                <p className="text-[11px] font-semibold leading-tight">{stage}</p>
                <p className="text-[10px] text-white/50">{FAKE_BY_STAGE[stage].length} lead(s)</p>
              </div>
              <div className="space-y-1.5 p-1.5">
                {FAKE_BY_STAGE[stage].map((l) => {
                  const on = selectedId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedId(l.id)}
                      className="w-full rounded-lg border px-2 py-1.5 text-left transition"
                      style={{
                        borderColor: on ? 'rgba(125,211,252,0.45)' : 'rgba(255,255,255,0.08)',
                        background: on ? 'rgba(79,195,247,0.12)' : 'rgba(0,0,0,0.25)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="truncate text-[11px] font-semibold">{l.name}</p>
                        <span
                          className="shrink-0 rounded-full border px-1 py-px text-[8px]"
                          style={{
                            borderColor: l.paused ? 'rgba(251,191,36,0.35)' : 'rgba(52,211,153,0.35)',
                            color: l.paused ? '#fcd34d' : '#6ee7b7',
                            background: l.paused ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                          }}
                        >
                          {l.paused ? 'PAUSADO' : 'BOT'}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[9px] text-white/55">{l.msg}</p>
                      <p className="mt-1 text-[8px] text-white/40">{l.platform} · {l.time}</p>
                    </button>
                  );
                })}
                {FAKE_BY_STAGE[stage].length === 0 && (
                  <p className="px-1 py-2 text-[9px] text-white/35">Sin leads</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4" style={{ borderColor: BRAND.border, background: BRAND.card }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Detalle — {selected?.name}</p>
            <p className="text-xs text-white/55">Etapa: {selectedStage}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold"
            style={{
              background: 'rgba(79,195,247,0.14)',
              borderColor: 'rgba(79,195,247,0.35)',
              color: '#e8f8ff',
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Descargar PDF
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <span
              key={s}
              className="rounded-full border px-2 py-0.5 text-[10px]"
              style={{
                borderColor: s === selectedStage ? 'rgba(125,211,252,0.45)' : 'rgba(255,255,255,0.1)',
                background: s === selectedStage ? 'rgba(79,195,247,0.12)' : 'rgba(255,255,255,0.04)',
                color: s === selectedStage ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
