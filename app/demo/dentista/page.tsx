'use client';

import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import {
  BRAND_DENTAL,
  DENTISTAS,
  citasHoyD,
  citasPorMes6,
  cuentasPorCobrarTotal,
  HOY_DENT,
  ingresosPorTipo,
  tratamientosEnCurso,
  type Cita,
} from '@/lib/mock-data-dentista';
import { useDentista } from './dentista-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function badgeStatus(c: Cita['status']) {
  const m: Record<Cita['status'], string> = {
    confirmada: 'bg-sky-500/25 text-sky-200',
    pendiente: 'bg-amber-500/20 text-amber-200',
    completada: 'bg-emerald-500/20 text-emerald-200',
    cancelada: 'bg-slate-600/40 text-slate-400',
  };
  return m[c];
}

export default function DentistaDashboardPage() {
  const { pacientes, consultas, citas } = useDentista();
  const getP = (id: string) => pacientes.find((x) => x.id === id);
  const hoy = citasHoyD(citas, HOY_DENT);
  const activos = pacientes.length;
  const cxp = cuentasPorCobrarTotal(pacientes);
  const tCurso = tratamientosEnCurso(consultas);
  const ingTipo = ingresosPorTipo(citas).map((x) => ({ name: x.name, ingresos: x.value }));
  const mes6 = citasPorMes6();

  const porDentista = DENTISTAS.map((d) => ({
    ...d,
    citas: hoy.filter((c) => c.dentista === d.nombre).sort((a, b) => a.hora.localeCompare(b.hora)),
  }));

  const alertasSaldo = pacientes.filter((p) => p.deuda > 2000);
  const alertasPend = citas.filter((c) => c.status === 'pendiente' && c.fecha >= HOY_DENT);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <p className="text-slate-500 text-sm">{BRAND_DENTAL.nombre}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: hoy.length, color: 'text-sky-300' },
          { label: 'Pacientes activos', value: activos, color: 'text-cyan-300' },
          { label: 'Cuentas por cobrar', value: cxp, format: fmt, color: 'text-amber-300' },
          { label: 'Tratamientos en curso', value: tCurso, color: 'text-fuchsia-300' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-slate-500 text-sm">{k.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${k.color}`}>
              {'format' in k && k.format ? (
                <AnimatedNumber value={k.value as number} format={k.format} />
              ) : (
                <AnimatedNumber value={k.value as number} decimals={0} />
              )}
            </p>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Citas de hoy por dentista</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {porDentista.map((col) => (
            <div key={col.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 min-h-[200px]">
              <p className="text-sky-400 font-medium text-sm mb-3">{col.nombre}</p>
              <div className="space-y-2">
                {col.citas.map((c) => {
                  const p = getP(c.pacienteId);
                  return (
                    <div key={c.id} className="text-xs border border-white/5 rounded-lg px-2 py-2">
                      <span className="font-mono text-sky-300">{c.hora}</span> · {p?.nombre} · {c.tipo}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${badgeStatus(c.status)}`}>{c.status}</span>
                    </div>
                  );
                })}
                {col.citas.length === 0 && <p className="text-slate-500 text-xs">Sin citas</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
          <h3 className="text-sm font-semibold text-amber-200 mb-2">Alertas</h3>
          <p className="text-xs text-slate-400 mb-2">Saldo elevado (&gt; $2,000)</p>
          <ul className="text-xs space-y-1">
            {alertasSaldo.map((p) => (
              <li key={p.id}>
                {p.nombre} — {fmt(p.deuda)}
              </li>
            ))}
            {alertasSaldo.length === 0 && <li className="text-slate-500">Ninguno</li>}
          </ul>
          <p className="text-xs text-slate-400 mt-3 mb-2">Citas próximas sin confirmar (pendiente)</p>
          <ul className="text-xs space-y-1">
            {alertasPend.slice(0, 5).map((c) => {
              const p = getP(c.pacienteId);
              return (
                <li key={c.id}>
                  {c.fecha} {c.hora} · {p?.nombre}
                </li>
              );
            })}
            {alertasPend.length === 0 && <li className="text-slate-500">Ninguna</li>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02] min-h-[260px]">
          <h3 className="text-sm font-semibold mb-4">Ingresos por tipo (citas completadas)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingTipo.length ? ingTipo : [{ name: '—', ingresos: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey="ingresos" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02] min-h-[260px]">
          <h3 className="text-sm font-semibold mb-4">Citas por mes (últimos 6)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mes6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
              <XAxis dataKey="mes" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Line type="monotone" dataKey="citas" stroke="#0284c7" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
