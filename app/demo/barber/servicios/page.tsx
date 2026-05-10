'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

export default function BarberServiciosPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;
  const accentText = isNail ? 'text-pink-600' : 'text-teal-300';
  const toggleActive = isNail ? 'bg-pink-500' : 'bg-teal-600';

  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(cfg.servicios.map((s) => [s.nombre, true]))
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  // Theme tokens
  const text = isNail ? 'text-zinc-900' : 'text-white';
  const textSubtle = isNail ? 'text-zinc-600' : 'text-slate-300';
  const textMuted = isNail ? 'text-zinc-500' : 'text-slate-400';
  const cardBorder = isNail ? 'border-pink-200' : 'border-white/10';
  const cardBg = isNail ? 'bg-white' : 'bg-white/[0.03]';
  const dividerBorder = isNail ? 'border-pink-100' : 'border-white/10';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
          style={{ background: cfg.acentoSoft, borderColor: `${accent}55`, color: accent }}
        >
          {cfg.emoji}
        </div>
        <div>
          <h1 className={`font-bold text-lg ${text}`}>{cfg.nombre}</h1>
          <p className={`text-sm ${textMuted}`}>
            {cfg.termServicio.charAt(0).toUpperCase() + cfg.termServicio.slice(1)}s disponibles — precios orientativos
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cfg.servicios.map((s) => (
          <div
            key={s.nombre}
            className={`rounded-2xl border overflow-hidden flex flex-col ${cardBorder} ${cardBg} shadow-sm`}
          >
            {/* Imagen miniatura realista (en vez de emoji 1988) */}
            <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-100">
              <Image
                src={s.imageUrl}
                alt={s.nombre}
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
              {s.stats && (
                <span
                  className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md"
                  style={{
                    background: `${accent}cc`,
                    color: '#fff',
                  }}
                >
                  {s.stats}
                </span>
              )}
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
              <div>
                <h3 className={`text-base font-bold ${text}`}>{s.nombre}</h3>
                {s.descripcion && (
                  <p className={`text-xs ${textMuted} mt-1 leading-snug`}>{s.descripcion}</p>
                )}
              </div>
              <p className={`font-bold text-lg ${accentText}`}>
                {fmt(s.precio)}{' '}
                <span className={`font-medium text-sm ${textMuted}`}>· {s.min} min</span>
              </p>
              <div className={`flex items-center justify-between mt-auto pt-3 border-t ${dividerBorder}`}>
                <span className={`text-xs font-semibold ${textSubtle}`}>
                  {on[s.nombre] ? 'Disponible' : 'No disponible'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on[s.nombre]}
                  onClick={() => setOn((prev) => ({ ...prev, [s.nombre]: !prev[s.nombre] }))}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    on[s.nombre] ? toggleActive : isNail ? 'bg-zinc-300' : 'bg-slate-600'
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
          </div>
        ))}
      </div>

      {/* Staff */}
      <div className={`rounded-xl border p-4 ${cardBorder} ${cardBg}`}>
        <p className={`text-xs font-bold mb-3 uppercase tracking-wide`} style={{ color: accent }}>
          Staff disponible
        </p>
        <div className="flex flex-wrap gap-3">
          {cfg.staff.map((st) => (
            <div
              key={st.nombre}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${dividerBorder} ${
                isNail ? 'bg-pink-50' : 'bg-white/[0.04]'
              }`}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden border" style={{ borderColor: `${accent}66` }}>
                <Image src={st.imageUrl} alt={st.nombre} fill sizes="36px" className="object-cover" unoptimized />
              </div>
              <div>
                <p className={`text-sm font-semibold leading-tight ${text}`}>{st.nombre}</p>
                <p className={`text-[11px] leading-tight ${textMuted}`}>{st.especialidad}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
