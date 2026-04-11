'use client';

import { useState, useMemo } from 'react';
import type { GrupoSMAE } from '@/lib/parse-smae';

const ACCENT = '#16a34a';

function badgeMacro(label: string, value: number, unit: string, color: string) {
  return (
    <span
      key={label}
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ background: `${color}18`, borderColor: `${color}40`, color }}
    >
      {label}: {value}{unit}
    </span>
  );
}

export default function EquivalentesClient({ grupos }: { grupos: GrupoSMAE[] }) {
  const [grupoActivo, setGrupoActivo] = useState(grupos[0]?.slug ?? '');
  const [query, setQuery] = useState('');

  const grupo = useMemo(() => grupos.find(g => g.slug === grupoActivo) ?? grupos[0], [grupos, grupoActivo]);

  // Resultados de búsqueda global
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const out: Array<{ alimento: string; porcion: string; grupo: string; emoji: string }> = [];
    for (const g of grupos) {
      for (const a of g.alimentos) {
        const name = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (name.includes(q)) out.push({ alimento: a.nombre, porcion: a.porcionCasera, grupo: g.nombre, emoji: g.emoji });
      }
    }
    return out.slice(0, 60);
  }, [query, grupos]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">📊 Sistema Mexicano de Equivalentes</h1>
        <p className="text-slate-400 text-sm mt-1">
          Consulta porciones y equivalencias de los {grupos.length} grupos de alimentos
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar alimento… ej: pollo, tortilla, manzana"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg leading-none"
          >×</button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchResults !== null && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-300">
              {searchResults.length === 0
                ? 'Sin resultados'
                : `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} para "${query}"`}
            </p>
            {searchResults.length === 60 && (
              <p className="text-[10px] text-slate-500">Mostrando los primeros 60</p>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
              {searchResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{r.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-100 truncate">{r.alimento}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.grupo}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-emerald-400 flex-shrink-0 font-semibold">
                    {r.porcion || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs de grupos */}
      {searchResults === null && (
        <>
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex gap-1.5 min-w-max">
              {grupos.map(g => (
                <button
                  key={g.slug}
                  onClick={() => setGrupoActivo(g.slug)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
                  style={
                    g.slug === grupoActivo
                      ? { background: ACCENT, color: '#fff' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }
                  }
                >
                  <span>{g.emoji}</span>
                  {g.labelCorto}
                  <span className="text-[10px] opacity-60 ml-0.5">({g.alimentos.length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabla del grupo activo */}
          {grupo && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              {/* Header del grupo */}
              <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{grupo.emoji}</span>
                  <h2 className="text-base font-bold text-white">{grupo.nombre}</h2>
                  <span className="text-xs text-slate-500 ml-1">{grupo.alimentos.length} alimentos</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {grupo.proteina > 0 && badgeMacro('Proteína', grupo.proteina, 'g', '#818cf8')}
                  {grupo.grasa > 0    && badgeMacro('Grasa',    grupo.grasa,    'g', '#fbbf24')}
                  {grupo.cho > 0      && badgeMacro('CHO',      grupo.cho,      'g', '#34d399')}
                  {grupo.calorias > 0 && badgeMacro('Kcal',     grupo.calorias, '', '#f87171')}
                  {grupo.calorias === 0 && (
                    <span className="text-xs text-slate-500 italic">Sin aporte energético significativo</span>
                  )}
                  <span className="text-[10px] text-slate-600 ml-1 self-center italic">por equivalente</span>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Alimento
                      </th>
                      <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Porción (medida casera)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {grupo.alimentos.map((a, i) => (
                      <tr
                        key={i}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-5 py-2.5 text-slate-200">{a.nombre}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-semibold text-emerald-400">
                          {a.porcionCasera || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[11px] text-slate-600 text-center pb-4">
        Fuente: Sistema Mexicano de Equivalentes (SMAE) — porciones en medida casera (tazas, piezas, cucharadas). Los macros son valores estándar por equivalente del grupo.
      </p>
    </div>
  );
}
