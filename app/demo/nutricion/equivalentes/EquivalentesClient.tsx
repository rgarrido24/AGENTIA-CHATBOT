'use client';

import { useState, useMemo } from 'react';
import type { GrupoSMAE } from '@/lib/parse-smae';
import { useNutricionTheme } from '../nutricion-theme-context';

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
  const { colors, theme } = useNutricionTheme();
  const isLight = theme === 'light';
  const [grupoActivo, setGrupoActivo] = useState(grupos[0]?.slug ?? '');
  const [query, setQuery] = useState('');

  const grupo = useMemo(() => grupos.find(g => g.slug === grupoActivo) ?? grupos[0], [grupos, grupoActivo]);

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
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>📊 Sistema Mexicano de Equivalentes</h1>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Consulta porciones y equivalencias de los {grupos.length} grupos de alimentos
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.textMuted }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar alimento… ej: pollo, tortilla, manzana"
          className="w-full rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none transition-colors"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg leading-none"
            style={{ color: colors.textMuted }}
          >×</button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchResults !== null && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.cardBgAlt }}
          >
            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              {searchResults.length === 0
                ? 'Sin resultados'
                : `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} para "${query}"`}
            </p>
            {searchResults.length === 60 && (
              <p className="text-[10px]" style={{ color: colors.textMuted }}>Mostrando los primeros 60</p>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                  style={{ borderTop: i > 0 ? `1px solid ${colors.divider}` : 'none' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{r.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: colors.textPrimary }}>{r.alimento}</p>
                      <p className="text-[10px] truncate" style={{ color: colors.textMuted }}>{r.grupo}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-semibold flex-shrink-0 text-emerald-600">
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
                      : { background: colors.cardBgAlt, color: colors.textSecondary }
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
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
            >
              {/* Header del grupo */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cardBgAlt }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{grupo.emoji}</span>
                  <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>{grupo.nombre}</h2>
                  <span className="text-xs ml-1" style={{ color: colors.textMuted }}>{grupo.alimentos.length} alimentos</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {grupo.proteina > 0 && badgeMacro('Proteína', grupo.proteina, 'g', '#818cf8')}
                  {grupo.grasa > 0    && badgeMacro('Grasa',    grupo.grasa,    'g', '#fbbf24')}
                  {grupo.cho > 0      && badgeMacro('CHO',      grupo.cho,      'g', '#34d399')}
                  {grupo.calorias > 0 && badgeMacro('Kcal',     grupo.calorias, '', '#f87171')}
                  {grupo.calorias === 0 && (
                    <span className="text-xs italic" style={{ color: colors.textMuted }}>Sin aporte energético significativo</span>
                  )}
                  <span className="text-[10px] ml-1 self-center italic" style={{ color: colors.textMuted }}>por equivalente</span>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.cardBgAlt }}>
                      <th
                        className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: colors.textMuted }}
                      >
                        Alimento
                      </th>
                      <th
                        className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: colors.textMuted }}
                      >
                        Porción (medida casera)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.alimentos.map((a, i) => (
                      <tr
                        key={i}
                        style={{ borderTop: `1px solid ${colors.divider}` }}
                      >
                        <td className="px-5 py-2.5" style={{ color: colors.textSecondary }}>{a.nombre}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-semibold text-emerald-600">
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

      <p className="text-[11px] text-center pb-4" style={{ color: isLight ? '#9ca3af' : '#475569' }}>
        Fuente: Sistema Mexicano de Equivalentes (SMAE) — porciones en medida casera (tazas, piezas, cucharadas). Los macros son valores estándar por equivalente del grupo.
      </p>
    </div>
  );
}
