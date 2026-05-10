'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { MOCK_SERVICIOS, type CategoriaServicio } from '@/lib/mock-data-spa';

const ACCENT = '#9333ea';
const PINK = '#ec4899';

const CATS: CategoriaServicio[] = ['Facial', 'Masaje', 'Corporal', 'Uñas', 'Depilación'];

export default function SpaServiciosPage() {
  const [cat, setCat] = useState<CategoriaServicio | 'Todas'>('Todas');

  const items = useMemo(() => {
    if (cat === 'Todas') return MOCK_SERVICIOS;
    return MOCK_SERVICIOS.filter((s) => s.categoria === cat);
  }, [cat]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <p className="text-zinc-600 dark:text-slate-400 text-sm">Catálogo demo — precios y duraciones referenciales.</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCat('Todas')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            cat === 'Todas'
              ? 'text-white border-transparent shadow-sm'
              : 'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5'
          }`}
          style={cat === 'Todas' ? { background: ACCENT } : undefined}
        >
          Todas
        </button>
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              cat === c
                ? 'text-white border-transparent shadow-sm'
                : 'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5'
            }`}
            style={cat === c ? { background: `linear-gradient(135deg, ${ACCENT}, ${PINK})` } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((s) => (
          <article
            key={s.id}
            className={`group rounded-2xl overflow-hidden border bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow flex flex-col ${
              !s.disponible ? 'opacity-60' : ''
            }`}
          >
            {/* Hero image */}
            <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/40 dark:to-pink-950/40">
              <Image
                src={s.imagen}
                alt={s.nombre}
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <span
                className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md text-white shadow-sm"
                style={{ background: `${ACCENT}cc` }}
              >
                {s.categoria}
              </span>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-2 flex-1">
              <h2 className="font-semibold text-lg text-zinc-900 dark:text-white leading-tight">
                {s.nombre}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-slate-400 flex-1">{s.descripcion}</p>
              <div className="flex items-end justify-between pt-3 border-t border-zinc-100 dark:border-white/10 mt-2">
                <div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: ACCENT }}>
                    ${s.precio}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-slate-500">{s.duracion} min</p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-slate-500 text-right">
                  Con <span className="text-zinc-700 dark:text-slate-300 font-medium">{s.especialista}</span>
                </p>
              </div>
              {!s.disponible && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No disponible temporalmente</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
