'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getDueño, MOCK_MASCOTAS, type Comportamiento } from '@/lib/mock-data-grooming';

function compBadge(c: Comportamiento) {
  const m: Record<Comportamiento, string> = {
    Tranquilo: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    Nervioso: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    Agresivo: 'bg-red-500/20 text-red-200 border-red-500/40',
    Juguetón: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  };
  return m[c];
}

export default function MascotasListPage() {
  const [q, setQ] = useState('');

  const lista = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return MOCK_MASCOTAS;
    return MOCK_MASCOTAS.filter((m) => {
      const d = getDueño(m.dueñoId);
      return (
        m.nombre.toLowerCase().includes(qq) ||
        m.raza.toLowerCase().includes(qq) ||
        d?.nombre.toLowerCase().includes(qq)
      );
    });
  }, [q]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por mascota, raza o dueño…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {lista.map((m) => {
          const d = getDueño(m.dueñoId);
          return (
            <Link
              key={m.id}
              href={`/demo/grooming/mascotas/${m.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-orange-500/40 transition"
            >
              <div className="flex items-start gap-3">
                <span className="text-4xl">{m.foto}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg">{m.nombre}</h2>
                  <p className="text-sm text-slate-400">{m.raza}</p>
                  <p className="text-xs text-slate-500 mt-1">Dueño: {d?.nombre}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-slate-300">{m.tamaño}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${compBadge(m.comportamiento)}`}>
                      {m.comportamiento}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {lista.length === 0 && <p className="text-slate-500 text-center py-12">Sin resultados.</p>}
    </div>
  );
}
