'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Wallet, TrendingUp, UserCheck, Award } from 'lucide-react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS, type GiroConfig } from '../giro-config';

const fmtMx = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

// Mock: distribución promedio del mes por staff (qué servicios atendió)
type StaffMonthRow = {
  staff: string;
  servicios: { nombre: string; cantidad: number }[];
};

function buildMockMonth(cfg: GiroConfig): StaffMonthRow[] {
  // Simulación: cada staff tomó una porción representativa de los servicios.
  return cfg.staff.map((st, idx) => {
    const ratio = st.rol === 'principal' ? 1 : 0.45;
    return {
      staff: st.nombre,
      servicios: cfg.servicios
        .map((s, sIdx) => ({
          nombre: s.nombre,
          cantidad: Math.max(0, Math.round((10 - sIdx + idx) * ratio * (1 - sIdx * 0.04))),
        }))
        .filter((row) => row.cantidad > 0),
    };
  });
}

export default function ComisionesPage() {
  const { giro } = useBarber();
  const cfg = giro ? GIRO_CONFIGS[giro] : GIRO_CONFIGS.barberia;
  const isNail = giro === 'nail';
  const accent = cfg.acento;

  const month = useMemo(() => buildMockMonth(cfg), [cfg]);

  const breakdown = month.map((row) => {
    const staff = cfg.staff.find((s) => s.nombre === row.staff)!;
    const detalle = row.servicios.map((sv) => {
      const svDef = cfg.servicios.find((s) => s.nombre === sv.nombre)!;
      // % comisión: usa el del servicio si existe, si no el del staff
      const pct = svDef.comisionPct ?? staff.comisionPct;
      const ingresoBruto = svDef.precio * sv.cantidad;
      const comision = Math.round(ingresoBruto * (pct / 100));
      return { ...sv, precio: svDef.precio, pct, ingresoBruto, comision };
    });
    const totalIngreso = detalle.reduce((a, b) => a + b.ingresoBruto, 0);
    const totalComision = detalle.reduce((a, b) => a + b.comision, 0);
    return { staff, detalle, totalIngreso, totalComision };
  });

  const totalIngresos = breakdown.reduce((a, b) => a + b.totalIngreso, 0);
  const totalComisiones = breakdown.reduce((a, b) => a + b.totalComision, 0);

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
          <h1 className={`text-2xl font-bold ${text}`}>Comisiones del staff</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Vista mensual — calcula automáticamente lo que le toca a cada {cfg.termArtista} (y ayudantes).
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: cfg.acentoSoft, color: accent, border: `1px solid ${accent}55` }}
        >
          MARZO 2025 · DEMO
        </span>
      </div>

      {/* KPIs arriba */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Ingresos brutos', value: fmtMx(totalIngresos), icon: TrendingUp },
          { label: 'Comisiones a pagar', value: fmtMx(totalComisiones), icon: Wallet },
          { label: 'Ganancia salón', value: fmtMx(totalIngresos - totalComisiones), icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border p-4 flex items-center gap-3 ${cardBorder} ${cardBg}`}>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: cfg.acentoSoft, color: accent }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>{label}</p>
              <p className={`text-xl font-extrabold ${text}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Por staff */}
      <div className="space-y-4">
        {breakdown.map(({ staff, detalle, totalIngreso, totalComision }) => (
          <div key={staff.nombre} className={`rounded-2xl border overflow-hidden ${cardBorder} ${cardBg}`}>
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${dividerBorder}`}>
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: `${accent}66` }}>
                <Image src={staff.imageUrl} alt={staff.nombre} fill sizes="48px" className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold ${text}`}>{staff.nombre}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: staff.rol === 'principal' ? `${accent}25` : 'rgba(148,163,184,0.18)',
                      color: staff.rol === 'principal' ? accent : isNail ? '#475569' : '#cbd5e1',
                    }}
                  >
                    {staff.rol === 'principal' ? cfg.termArtista : 'Ayudante'}
                  </span>
                  <span className={`text-xs ${textMuted}`}>· {staff.especialidad}</span>
                </div>
                <p className={`text-xs ${textSubtle}`}>
                  Comisión base: <span className="font-bold">{staff.comisionPct}%</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[11px] uppercase tracking-wide font-bold ${textMuted}`}>A pagar</p>
                <p className="text-lg font-extrabold" style={{ color: accent }}>
                  {fmtMx(totalComision)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-[11px] uppercase tracking-wider ${headBg}`}>
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Servicio</th>
                    <th className="px-4 py-2.5 font-bold">Cantidad</th>
                    <th className="px-4 py-2.5 font-bold">Precio</th>
                    <th className="px-4 py-2.5 font-bold">% Comisión</th>
                    <th className="px-4 py-2.5 font-bold">Ingreso</th>
                    <th className="px-4 py-2.5 font-bold">Comisión</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dividerBorder}`}>
                  {detalle.map((d) => (
                    <tr key={d.nombre}>
                      <td className={`px-4 py-2.5 font-semibold ${text}`}>{d.nombre}</td>
                      <td className={`px-4 py-2.5 tabular-nums ${textSubtle}`}>{d.cantidad}</td>
                      <td className={`px-4 py-2.5 tabular-nums ${textMuted}`}>{fmtMx(d.precio)}</td>
                      <td className={`px-4 py-2.5 tabular-nums font-semibold`} style={{ color: accent }}>
                        {d.pct}%
                      </td>
                      <td className={`px-4 py-2.5 tabular-nums ${textSubtle}`}>{fmtMx(d.ingresoBruto)}</td>
                      <td className={`px-4 py-2.5 tabular-nums font-bold ${text}`}>{fmtMx(d.comision)}</td>
                    </tr>
                  ))}
                  <tr className={isNail ? 'bg-pink-50' : 'bg-white/[0.06]'}>
                    <td className={`px-4 py-2.5 font-extrabold ${text}`} colSpan={4}>
                      Total
                    </td>
                    <td className={`px-4 py-2.5 tabular-nums font-extrabold ${text}`}>{fmtMx(totalIngreso)}</td>
                    <td className="px-4 py-2.5 tabular-nums font-extrabold" style={{ color: accent }}>
                      {fmtMx(totalComision)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 flex items-start gap-3 ${cardBorder} ${cardBg}`}>
        <UserCheck className="w-5 h-5 mt-0.5" style={{ color: accent }} />
        <div>
          <p className={`text-sm font-bold ${text}`}>¿Cómo funciona?</p>
          <p className={`text-xs mt-1 ${textSubtle}`}>
            Cada servicio puede tener su propio % de comisión (definido en el catálogo). Si no se define, se usa el % base del{' '}
            {cfg.termArtista}. Los ayudantes ganan un % menor pero también participan. El cálculo se hace automático
            cuando una cita se marca como completada y pagada.
          </p>
        </div>
      </div>
    </div>
  );
}
