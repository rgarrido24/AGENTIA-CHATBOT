'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Building2, Megaphone, Package } from 'lucide-react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';

const fmtMx = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function FinanzasPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;

  // Mock: ingresos del mes (estimado por servicios * cantidad simulada)
  const ingresosPorServicio = useMemo(() => {
    return cfg.servicios.map((s, idx) => {
      const cantidad = Math.max(2, 28 - idx * 2);
      return {
        servicio: s.nombre,
        precio: s.precio,
        cantidad,
        total: s.precio * cantidad,
      };
    });
  }, [cfg.servicios]);

  const totalIngresos = ingresosPorServicio.reduce((a, b) => a + b.total, 0);

  // Comisiones estimadas (% promedio del staff principal)
  const principal = cfg.staff.find((s) => s.rol === 'principal') ?? cfg.staff[0];
  const comisionEstimada = Math.round(totalIngresos * (principal.comisionPct / 100) * 0.85);

  // Gastos: fijos del cfg
  const gastos = cfg.gastosFijos;
  const totalGastos = gastos.reduce((a, b) => a + b.monto, 0);

  const utilidadBruta = totalIngresos - totalGastos;
  const utilidadNeta = utilidadBruta - comisionEstimada;
  const margenPct = totalIngresos ? Math.round((utilidadNeta / totalIngresos) * 100) : 0;

  // Categorías
  const gastosPorCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
    return acc;
  }, {});

  // Theme tokens
  const text = isNail ? 'text-zinc-900' : 'text-white';
  const textSubtle = isNail ? 'text-zinc-600' : 'text-slate-300';
  const textMuted = isNail ? 'text-zinc-500' : 'text-slate-400';
  const cardBorder = isNail ? 'border-pink-200' : 'border-white/10';
  const cardBg = isNail ? 'bg-white' : 'bg-white/[0.04]';
  const headBg = isNail ? 'bg-pink-50 text-pink-700' : 'bg-white/[0.04] text-slate-300';
  const dividerBorder = isNail ? 'border-pink-100' : 'border-white/10';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${text}`}>Ingresos vs Gastos</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Corte de caja del mes — ingresos brutos por servicios menos gastos fijos, variables, inventario y comisiones.
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: cfg.acentoSoft, color: accent, border: `1px solid ${accent}55` }}
        >
          MARZO 2025 · DEMO
        </span>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-2xl border p-4 ${cardBorder} ${cardBg}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
            <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>Ingresos</p>
          </div>
          <p className={`text-2xl font-extrabold mt-1 ${text}`}>{fmtMx(totalIngresos)}</p>
          <p className={`text-[11px] ${textSubtle} mt-1`}>{ingresosPorServicio.length} servicios</p>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBorder} ${cardBg}`}>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
            <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>Gastos</p>
          </div>
          <p className={`text-2xl font-extrabold mt-1 ${text}`}>{fmtMx(totalGastos + comisionEstimada)}</p>
          <p className={`text-[11px] ${textSubtle} mt-1`}>incluye comisiones</p>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBorder} ${cardBg}`}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" style={{ color: accent }} />
            <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>Utilidad neta</p>
          </div>
          <p
            className="text-2xl font-extrabold mt-1"
            style={{ color: utilidadNeta >= 0 ? '#10b981' : '#ef4444' }}
          >
            {fmtMx(utilidadNeta)}
          </p>
          <p className={`text-[11px] ${textSubtle} mt-1`}>después de gastos y comisiones</p>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBorder} ${cardBg}`}>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4" style={{ color: accent }} />
            <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>Margen</p>
          </div>
          <p className="text-2xl font-extrabold mt-1" style={{ color: accent }}>
            {margenPct}%
          </p>
          <p className={`text-[11px] ${textSubtle} mt-1`}>sobre ingresos</p>
        </div>
      </div>

      {/* Comparativo barra */}
      <div className={`rounded-2xl border p-4 ${cardBorder} ${cardBg}`}>
        <p className={`text-sm font-bold mb-3 ${text}`}>Distribución del ingreso</p>
        <div className="h-9 w-full rounded-full overflow-hidden flex border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {[
            { label: 'Comisiones', value: comisionEstimada, color: accent },
            { label: 'Gastos fijos', value: gastosPorCategoria.fijo ?? 0, color: '#6366f1' },
            { label: 'Variables', value: gastosPorCategoria.variable ?? 0, color: '#f59e0b' },
            { label: 'Inventario', value: gastosPorCategoria.inventario ?? 0, color: '#94a3b8' },
            { label: 'Utilidad', value: Math.max(0, utilidadNeta), color: '#10b981' },
          ].map((seg) => {
            const pct = totalIngresos ? (seg.value / totalIngresos) * 100 : 0;
            return (
              <div
                key={seg.label}
                style={{ width: `${pct}%`, background: seg.color }}
                title={`${seg.label}: ${fmtMx(seg.value)} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          {[
            { label: 'Comisiones', value: comisionEstimada, color: accent },
            { label: 'Gastos fijos', value: gastosPorCategoria.fijo ?? 0, color: '#6366f1' },
            { label: 'Variables', value: gastosPorCategoria.variable ?? 0, color: '#f59e0b' },
            { label: 'Inventario', value: gastosPorCategoria.inventario ?? 0, color: '#94a3b8' },
            { label: 'Utilidad', value: Math.max(0, utilidadNeta), color: '#10b981' },
          ].map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: seg.color }} />
              <div className="min-w-0">
                <p className={`text-[11px] font-bold ${text} truncate`}>{seg.label}</p>
                <p className={`text-[10px] ${textSubtle} tabular-nums truncate`}>{fmtMx(seg.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tabla ingresos */}
        <div className={`rounded-2xl border overflow-hidden ${cardBorder} ${cardBg}`}>
          <div className={`flex items-center gap-2 px-4 py-3 border-b ${dividerBorder}`}>
            <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
            <p className={`font-bold ${text}`}>Ingresos por servicio</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-[11px] uppercase tracking-wider ${headBg}`}>
                <tr>
                  <th className="px-4 py-2.5 font-bold">Servicio</th>
                  <th className="px-4 py-2.5 font-bold">Cant.</th>
                  <th className="px-4 py-2.5 font-bold">Precio</th>
                  <th className="px-4 py-2.5 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dividerBorder}`}>
                {ingresosPorServicio.map((r) => (
                  <tr key={r.servicio}>
                    <td className={`px-4 py-2.5 font-semibold ${text}`}>{r.servicio}</td>
                    <td className={`px-4 py-2.5 tabular-nums ${textSubtle}`}>{r.cantidad}</td>
                    <td className={`px-4 py-2.5 tabular-nums ${textMuted}`}>{fmtMx(r.precio)}</td>
                    <td className={`px-4 py-2.5 tabular-nums font-bold ${text}`}>{fmtMx(r.total)}</td>
                  </tr>
                ))}
                <tr className={isNail ? 'bg-pink-50' : 'bg-white/[0.06]'}>
                  <td className={`px-4 py-2.5 font-extrabold ${text}`} colSpan={3}>
                    Total ingresos
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-extrabold" style={{ color: '#10b981' }}>
                    {fmtMx(totalIngresos)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla gastos */}
        <div className={`rounded-2xl border overflow-hidden ${cardBorder} ${cardBg}`}>
          <div className={`flex items-center gap-2 px-4 py-3 border-b ${dividerBorder}`}>
            <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
            <p className={`font-bold ${text}`}>Gastos del mes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-[11px] uppercase tracking-wider ${headBg}`}>
                <tr>
                  <th className="px-4 py-2.5 font-bold">Concepto</th>
                  <th className="px-4 py-2.5 font-bold">Categoría</th>
                  <th className="px-4 py-2.5 font-bold">Fecha</th>
                  <th className="px-4 py-2.5 font-bold">Monto</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dividerBorder}`}>
                {gastos.map((g) => {
                  const Icon = g.categoria === 'fijo' ? Building2 : g.categoria === 'variable' ? Megaphone : Package;
                  return (
                    <tr key={g.concepto}>
                      <td className={`px-4 py-2.5 font-semibold ${text}`}>{g.concepto}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            background:
                              g.categoria === 'fijo'
                                ? 'rgba(99,102,241,0.18)'
                                : g.categoria === 'variable'
                                  ? 'rgba(245,158,11,0.22)'
                                  : 'rgba(148,163,184,0.18)',
                            color:
                              g.categoria === 'fijo'
                                ? '#6366f1'
                                : g.categoria === 'variable'
                                  ? '#f59e0b'
                                  : isNail
                                    ? '#475569'
                                    : '#cbd5e1',
                          }}
                        >
                          <Icon className="w-3 h-3" />
                          {g.categoria}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 tabular-nums text-xs ${textMuted}`}>{g.fecha}</td>
                      <td className={`px-4 py-2.5 tabular-nums font-bold ${text}`}>{fmtMx(g.monto)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className={`px-4 py-2.5 font-bold ${text}`} colSpan={3}>
                    Comisiones ({principal.comisionPct}% promedio)
                  </td>
                  <td className={`px-4 py-2.5 tabular-nums font-bold ${text}`}>{fmtMx(comisionEstimada)}</td>
                </tr>
                <tr className={isNail ? 'bg-pink-50' : 'bg-white/[0.06]'}>
                  <td className={`px-4 py-2.5 font-extrabold ${text}`} colSpan={3}>
                    Total gastos
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-extrabold" style={{ color: '#ef4444' }}>
                    {fmtMx(totalGastos + comisionEstimada)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
