'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { MOCK_SERVICIOS, RAZA_TAMAÑO_SUGERIDO, type TamañoMascota } from '@/lib/mock-data-grooming';
import { useGrooming } from '../grooming-context';

const TAMS: TamañoMascota[] = ['Pequeño', 'Mediano', 'Grande', 'Extra Grande'];

export default function GroomingServiciosPage() {
  const { serviciosOn, toggleServicio } = useGrooming();
  const [raza, setRaza] = useState('Golden Retriever');

  const sugerido = RAZA_TAMAÑO_SUGERIDO[raza] ?? ('Mediano' as TamañoMascota);
  const servEjemplo = MOCK_SERVICIOS[0]!;

  const precioEjemplo = useMemo(() => {
    const k =
      sugerido === 'Pequeño'
        ? 'pequeño'
        : sugerido === 'Mediano'
          ? 'mediano'
          : sugerido === 'Grande'
            ? 'grande'
            : 'extraGrande';
    return servEjemplo.precioBase[k];
  }, [sugerido]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <p className="text-zinc-600 dark:text-slate-400 text-sm">Precios en MXN según tamaño. Activa o desactiva servicios para la agenda.</p>

      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 shadow-sm dark:shadow-none">
        <h2 className="font-semibold mb-4 text-zinc-900 dark:text-white">Calculadora rápida</h2>
        <label className="text-xs text-zinc-500 dark:text-slate-400">Raza (sugerimos tamaño)</label>
        <select
          value={raza}
          onChange={(e) => setRaza(e.target.value)}
          className="mt-1 w-full max-w-md rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 px-3 py-2 text-sm text-zinc-900 dark:text-slate-100"
        >
          {Object.keys(RAZA_TAMAÑO_SUGERIDO).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-orange-600 dark:text-orange-200">
          Tamaño sugerido: <strong>{sugerido}</strong> — Baño básico desde <strong>${precioEjemplo}</strong>
        </p>
      </div>

      {/* Grid de servicios con imágenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MOCK_SERVICIOS.map((s) => {
          const activo = serviciosOn[s.id] !== false;
          return (
            <article
              key={s.id}
              className={`group rounded-2xl overflow-hidden border bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow flex flex-col ${
                activo ? '' : 'opacity-60'
              }`}
            >
              <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40">
                <Image
                  src={s.imagen}
                  alt={s.nombre}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500/90 text-white shadow-sm">
                  {s.categoria}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-white leading-tight">{s.nombre}</h3>
                <p className="text-xs text-zinc-600 dark:text-slate-400">{s.descripcion}</p>

                <div className="grid grid-cols-4 gap-1 text-center mt-3 pt-3 border-t border-zinc-100 dark:border-white/10">
                  {TAMS.map((t) => {
                    const k = t === 'Pequeño' ? 'pequeño' : t === 'Mediano' ? 'mediano' : t === 'Grande' ? 'grande' : 'extraGrande';
                    return (
                      <div key={t}>
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 dark:text-slate-500">{t.charAt(0)}</p>
                        <p className="text-sm font-bold text-orange-600 dark:text-orange-300 tabular-nums">${s.precioBase[k]}</p>
                        <p className="text-[9px] text-zinc-500 dark:text-slate-500">{s.duracion[k]}min</p>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => toggleServicio(s.id)}
                  className={`mt-3 w-full px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activo
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-600/30 dark:text-emerald-200'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {activo ? 'Disponible' : 'No disponible'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
