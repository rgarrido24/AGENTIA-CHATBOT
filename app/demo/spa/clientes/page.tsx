'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Crown, Mail, Phone, Sparkles, User } from 'lucide-react';
import { MOCK_CLIENTES, type NivelCliente } from '@/lib/mock-data-spa';

const ACCENT = '#9333ea';

function nivelBadge(n: NivelCliente) {
  if (n === 'VIP') return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-600/30 dark:text-fuchsia-200 dark:border-fuchsia-500/40';
  if (n === 'Regular') return 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-600/25 dark:text-violet-200 dark:border-violet-500/35';
  return 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-slate-600/30 dark:text-slate-300 dark:border-slate-500/35';
}

function ClientesInner() {
  const sp = useSearchParams();
  const highlight = sp.get('highlight') ?? '';
  const [filtro, setFiltro] = useState<NivelCliente | 'Todos'>('Todos');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`cliente-${highlight}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight]);

  const lista = useMemo(() => {
    return MOCK_CLIENTES.filter((c) => {
      if (filtro !== 'Todos' && c.nivel !== filtro) return false;
      const qq = q.trim().toLowerCase();
      if (!qq) return true;
      return (
        c.nombre.toLowerCase().includes(qq) ||
        c.email.toLowerCase().includes(qq) ||
        c.telefono.includes(qq) ||
        c.servicioFavorito.toLowerCase().includes(qq)
      );
    });
  }, [filtro, q]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {(['Todos', 'Nuevo', 'Regular', 'VIP'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtro === f
                  ? 'text-white border-transparent shadow-sm'
                  : 'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5'
              }`}
              style={filtro === f ? { background: ACCENT } : undefined}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono, email…"
          className="w-full sm:w-72 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 px-4 py-2 text-sm text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lista.map((c) => {
          const ring = highlight === c.id ? 'ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-white dark:ring-offset-[#0a0f1a]' : '';
          return (
            <article
              key={c.id}
              id={`cliente-${c.id}`}
              className={`rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 transition shadow-sm dark:shadow-none ${ring}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl border"
                    style={{ background: 'rgba(147,51,234,0.15)', borderColor: 'rgba(147,51,234,0.35)' }}
                  >
                    <User className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg leading-tight text-zinc-900 dark:text-white">{c.nombre}</h2>
                    <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${nivelBadge(c.nivel)}`}>
                      {c.nivel === 'VIP' && <Crown className="w-3 h-3 inline mr-1" />}
                      {c.nivel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-zinc-400 dark:text-slate-500" />
                  {c.telefono}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-zinc-400 dark:text-slate-500" />
                  {c.email}
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-fuchsia-500 dark:text-fuchsia-400" />
                  <span className="text-zinc-700 dark:text-slate-300">Favorito:</span> {c.servicioFavorito}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-zinc-500 dark:text-slate-500">Visitas</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">{c.visitas}</p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-slate-500">Gasto total</p>
                  <p className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">${c.gasto_total.toLocaleString('es-MX')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-zinc-500 dark:text-slate-500">Última visita</p>
                  <p className="text-zinc-700 dark:text-slate-300">{c.ultimaVisita}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500 dark:text-slate-500 line-clamp-2 border-t border-zinc-100 dark:border-white/5 pt-3">
                <span className="text-zinc-400 dark:text-slate-600">Notas:</span> {c.notas}
              </p>
            </article>
          );
        })}
      </div>
      {lista.length === 0 && <p className="text-center text-zinc-500 dark:text-slate-500 py-12">No hay clientes con ese criterio.</p>}
    </div>
  );
}

export default function SpaClientesPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500 dark:text-slate-500 text-center py-12">Cargando clientes…</div>}>
      <ClientesInner />
    </Suspense>
  );
}
