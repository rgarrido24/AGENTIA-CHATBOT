'use client';

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
      <p className="text-slate-500 text-sm">Catálogo demo — precios y duraciones referenciales.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCat('Todas')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            cat === 'Todas' ? 'text-white border-transparent' : 'border-white/10 text-slate-400'
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
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              cat === c ? 'text-white border-transparent' : 'border-white/10 text-slate-400 hover:bg-white/5'
            }`}
            style={cat === c ? { background: `linear-gradient(135deg, ${ACCENT}, ${PINK})` } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((s) => (
          <article
            key={s.id}
            className={`rounded-2xl border p-5 flex flex-col gap-2 ${
              s.disponible ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-fuchsia-500/30 text-fuchsia-200">
                {s.categoria}
              </span>
            </div>
            <h2 className="font-semibold text-lg text-white">{s.nombre}</h2>
            <p className="text-sm text-slate-400 flex-1">{s.descripcion}</p>
            <div className="flex items-end justify-between pt-2 border-t border-white/10 mt-2">
              <div>
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                  ${s.precio}
                </p>
                <p className="text-xs text-slate-500">{s.duracion} min</p>
              </div>
              <p className="text-xs text-slate-500 text-right">
                Con <span className="text-slate-300">{s.especialista}</span>
              </p>
            </div>
            {!s.disponible && <p className="text-xs text-amber-400">No disponible temporalmente</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
