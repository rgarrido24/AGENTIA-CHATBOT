'use client';

import { useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

type Tab = 'manana' | 'pasado' | 'reactivar';

function waUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function BarberRecordatoriosPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;

  const [tab, setTab] = useState<Tab>('manana');

  const labels = useMemo(
    () =>
      ({
        manana: 'Confirmación (cita mañana)',
        pasado: 'Recordatorio 24h (pasado mañana)',
        reactivar: `Reactivación ${isNail ? 'clientas' : 'clientes'}`,
      }) as const,
    [isNail]
  );

  // Theme tokens
  const text = isNail ? 'text-zinc-900' : 'text-white';
  const textSubtle = isNail ? 'text-zinc-600' : 'text-slate-300';
  const textMuted = isNail ? 'text-zinc-500' : 'text-slate-400';
  const cardBorder = isNail ? 'border-pink-200' : 'border-white/10';
  const cardBg = isNail ? 'bg-white' : 'bg-white/[0.05]';
  const tabInactiveBg = isNail
    ? 'bg-white text-pink-700 border-pink-200 hover:border-pink-400'
    : 'bg-white/[0.05] text-slate-200 border-white/15 hover:border-white/30';
  const waBtn = isNail
    ? 'bg-pink-500 text-white hover:bg-pink-600'
    : 'bg-emerald-500 text-white hover:bg-emerald-600';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <p className={`text-sm ${textMuted}`}>
        Plantillas listas para WhatsApp — demo sin envío automático.
      </p>

      <div className="flex flex-wrap gap-2">
        {(['manana', 'pasado', 'reactivar'] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition shadow-sm ${
                active ? 'text-white' : tabInactiveBg
              }`}
              style={
                active
                  ? { background: accent, borderColor: accent, boxShadow: `0 6px 18px ${accent}55` }
                  : undefined
              }
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === 'manana' && (
        <ul className="space-y-3">
          {cfg.recordatoriosManana.map((c) => {
            const msg = cfg.recordatorioPlantilla(c.nombre, c.fecha, c.hora);
            return (
              <li
                key={c.nombre}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${cardBorder} ${cardBg}`}
              >
                <div>
                  <p className={`font-semibold ${text}`}>{c.nombre}</p>
                  <p className={`text-xs ${textSubtle}`}>
                    {c.fecha} · {c.hora}
                  </p>
                </div>
                <a
                  href={waUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition ${waBtn}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'pasado' && (
        <ul className="space-y-3">
          {cfg.recordatoriosPasado.map((c) => {
            const msg = cfg.recordatorioPasadoPlantilla(c.nombre, c.fecha, c.hora);
            return (
              <li
                key={c.nombre}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${cardBorder} ${cardBg}`}
              >
                <div>
                  <p className={`font-semibold ${text}`}>{c.nombre}</p>
                  <p className={`text-xs ${textSubtle}`}>
                    {c.fecha} · {c.hora}
                  </p>
                </div>
                <a
                  href={waUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition ${waBtn}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'reactivar' && (
        <ul className="space-y-3">
          {cfg.recordatoriosInactivos.map((nombre) => {
            const msg = cfg.reactivacionPlantilla(nombre);
            return (
              <li
                key={nombre}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${cardBorder} ${cardBg}`}
              >
                <div>
                  <p className={`font-semibold ${text}`}>{nombre}</p>
                  <p className={`text-xs ${textSubtle}`}>Sin visita +30 días (demo)</p>
                </div>
                <a
                  href={waUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition ${waBtn}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
