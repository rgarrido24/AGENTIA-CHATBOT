'use client';

import { useState } from 'react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

export default function BarberServiciosPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;
  const accentText = isNail ? 'text-pink-500' : 'text-teal-300';
  const toggleActive = isNail ? 'bg-pink-500' : 'bg-teal-600';

  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(cfg.servicios.map((s) => [s.nombre, true]))
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{cfg.emoji}</span>
        <div>
          <h1 className="font-semibold text-base dark:text-white text-zinc-900">{cfg.nombre}</h1>
          <p className="text-zinc-500 dark:text-slate-500 text-sm">
            {cfg.termServicio.charAt(0).toUpperCase() + cfg.termServicio.slice(1)}s disponibles — precios orientativos (demo)
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cfg.servicios.map((s) => (
          <div
            key={s.nombre}
            className="rounded-2xl border p-5 flex flex-col gap-3 dark:border-white/10 dark:bg-white/[0.03] border-zinc-200 bg-white shadow-sm"
          >
            <div className="text-4xl">{s.emoji}</div>
            <div>
              <h3 className="text-base font-semibold dark:text-white text-zinc-900">{s.nombre}</h3>
              {s.descripcion && (
                <p className="text-xs dark:text-slate-500 text-zinc-500 mt-0.5">{s.descripcion}</p>
              )}
            </div>
            <p className={`font-bold ${accentText}`}>
              {fmt(s.precio)}{' '}
              <span className="dark:text-slate-500 text-zinc-500 font-normal text-sm">· {s.min} min</span>
            </p>
            {s.stats && <p className="text-xs dark:text-slate-500 text-zinc-500">{s.stats}</p>}
            <div className="flex items-center justify-between mt-auto pt-2 border-t dark:border-white/10 border-zinc-100">
              <span className="text-xs dark:text-slate-400 text-zinc-500">
                {on[s.nombre] ? 'Disponible' : 'No disponible'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on[s.nombre]}
                onClick={() => setOn((prev) => ({ ...prev, [s.nombre]: !prev[s.nombre] }))}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  on[s.nombre] ? toggleActive : 'bg-slate-600'
                }`}
                style={on[s.nombre] ? { backgroundColor: accent } : undefined}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    on[s.nombre] ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-4 dark:border-white/10 dark:bg-white/[0.02] border-zinc-200 bg-zinc-50">
        <p className="text-xs dark:text-slate-500 text-zinc-600">
          <span style={{ color: accent }} className="font-semibold">Staff disponible: </span>
          {cfg.staff.map((st) => `${st.emoji} ${st.nombre} (${st.especialidad})`).join(' · ')}
        </p>
      </div>
    </div>
  );
}
