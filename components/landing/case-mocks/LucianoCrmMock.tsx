'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

type StatusSeg = 'nuevo' | 'contactado' | 'interesado' | 'cerrado';

type FakeLead = {
  id: string;
  nombre: string;
  telefono: string;
  campana: string;
  status: StatusSeg;
  notas: string;
  createdAt: string;
};

const ACCENT = '#50C878';

const STATUS_CFG: Record<StatusSeg, { label: string; bg: string; color: string }> = {
  nuevo: { label: 'Nuevo', bg: '#f1f5f9', color: '#64748b' },
  contactado: { label: 'Contactado', bg: '#eff6ff', color: '#2563eb' },
  interesado: { label: 'Interesado', bg: '#fffbeb', color: '#b45309' },
  cerrado: { label: 'Cerrado ✓', bg: '#ecfdf5', color: '#047857' },
};

const LEADS: FakeLead[] = [
  {
    id: 'l1',
    nombre: 'Valentina Ríos',
    telefono: '+54 9 11 4523-8891',
    campana: 'Meta — Formulario vidrios',
    status: 'nuevo',
    notas: 'Preguntó por paquete premium',
    createdAt: '2026-07-09T14:22:00',
  },
  {
    id: 'l2',
    nombre: 'Martín López',
    telefono: '+54 9 351 678-9012',
    campana: 'Instagram DM',
    status: 'contactado',
    notas: 'Pidió precios por DM',
    createdAt: '2026-07-09T11:05:00',
  },
  {
    id: 'l3',
    nombre: 'Sofía Méndez',
    telefono: '+54 9 81 5555-1212',
    campana: 'Meta — Leads automáticos',
    status: 'interesado',
    notas: 'Quiere demo del CRM',
    createdAt: '2026-07-08T16:40:00',
  },
  {
    id: 'l4',
    nombre: 'Diego Peralta',
    telefono: '+54 9 22 4444-9090',
    campana: 'Facebook Ads',
    status: 'cerrado',
    notas: 'Contrato firmado · demo enviada',
    createdAt: '2026-07-07T09:15:00',
  },
];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function LucianoCrmMock() {
  const [selectedId, setSelectedId] = useState('l2');
  const selected = LEADS.find((l) => l.id === selectedId) ?? LEADS[0];
  const totalHoy = 12;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] shadow-inner">
      <div className="border-b border-[#e2e8f0] bg-white/95 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto min-w-0">
            <p className="truncate text-xs font-semibold text-[#0f766e]">Luciano Ads</p>
            <p className="text-sm font-bold">Panel Gestor de Leads</p>
            <p className="text-[10px] text-[#64748b]">Simulación · datos ficticios</p>
          </div>
          {[
            { label: 'Total', value: LEADS.length },
            { label: 'Hoy', value: totalHoy },
            { label: 'Esta semana', value: 47 },
            { label: 'Contactados', value: 3 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="min-w-[56px] rounded-xl border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-center"
            >
              <p className="text-base font-extrabold tabular-nums leading-tight" style={{ color: ACCENT }}>
                {value}
              </p>
              <p className="mt-0.5 text-[9px] text-[#64748b]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="border-b border-[#e2e8f0] bg-white lg:w-[42%] lg:border-b-0 lg:border-r">
          {LEADS.map((lead) => {
            const cfg = STATUS_CFG[lead.status];
            const on = lead.id === selectedId;
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedId(lead.id)}
                className="flex w-full items-start gap-3 border-b border-[#e2e8f0] px-4 py-3 text-left transition"
                style={{
                  background: on ? 'rgba(80,200,120,0.14)' : 'transparent',
                  borderLeft: on ? `3px solid ${ACCENT}` : '3px solid transparent',
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: '#e2e8f0', color: '#64748b' }}
                >
                  {initials(lead.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{lead.nombre}</p>
                  <p className="truncate text-xs text-[#64748b]">{lead.telefono}</p>
                  <span
                    className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: '#ecfdf5', color: '#047857' }}
                  >
                    {lead.campana.length > 22 ? `${lead.campana.slice(0, 22)}…` : lead.campana}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-white p-4">
          <p className="text-sm font-bold">{selected.nombre}</p>
          <p className="text-xs text-[#64748b]">{selected.telefono}</p>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Estado de seguimiento
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_CFG) as StatusSeg[]).map((s) => {
              const cfg = STATUS_CFG[s];
              const on = selected.status === s;
              return (
                <span
                  key={s}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: on ? cfg.bg : '#f1f5f9',
                    color: on ? cfg.color : '#64748b',
                    borderColor: on ? cfg.color : '#e2e8f0',
                  }}
                >
                  {cfg.label}
                </span>
              );
            })}
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Notas</p>
          <div className="mt-2 rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#334155]">
            {selected.notas}
          </div>
          <textarea
            readOnly
            placeholder="Agregar nota interna…"
            className="mt-2 w-full resize-none rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none"
            rows={2}
          />

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: '#16a34a' }}
          >
            <MessageCircle className="h-4 w-4" />
            Contactar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
