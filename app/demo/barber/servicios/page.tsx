'use client';

import { useState } from 'react';

const SERVICIOS = [
  { emoji: '✂️', nombre: 'Corte clásico', precio: 120, min: 30, stats: 'Más solicitado esta semana' },
  { emoji: '✨', nombre: 'Fade/Degradado', precio: 150, min: 40, stats: 'Más solicitado esta semana' },
  { emoji: '💈', nombre: 'Corte + Barba', precio: 180, min: 45, stats: 'Combo estrella' },
  { emoji: '🪒', nombre: 'Arreglo de barba', precio: 80, min: 20, stats: 'Alta rotación viernes' },
  { emoji: '🎨', nombre: 'Tinte', precio: 200, min: 60, stats: 'Subió 12% vs. mes pasado' },
  { emoji: '💆', nombre: 'Tratamiento capilar', precio: 250, min: 45, stats: 'Nuevo este mes' },
  { emoji: '🧴', nombre: 'Afeitado clásico', precio: 100, min: 25, stats: 'Más solicitado esta semana' },
];

export default function BarberServiciosPage() {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SERVICIOS.map((s) => [s.nombre, true]))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <p className="text-slate-500 text-sm">Catálogo de servicios — precios y duración orientativos (demo).</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SERVICIOS.map((s) => (
          <div
            key={s.nombre}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3"
          >
            <div className="text-5xl">{s.emoji}</div>
            <h3 className="text-lg font-semibold text-white">{s.nombre}</h3>
            <p className="text-teal-300 font-bold">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
                s.precio
              )}{' '}
              <span className="text-slate-500 font-normal text-sm">· {s.min} min</span>
            </p>
            <p className="text-xs text-slate-500">{s.stats}</p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400">{on[s.nombre] ? 'Disponible' : 'No disponible'}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on[s.nombre]}
                onClick={() => setOn((prev) => ({ ...prev, [s.nombre]: !prev[s.nombre] }))}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  on[s.nombre] ? 'bg-teal-600' : 'bg-slate-600'
                }`}
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
    </div>
  );
}
