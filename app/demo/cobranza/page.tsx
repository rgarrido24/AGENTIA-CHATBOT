'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MOROSIDAD_TENDENCIA,
  accionSugeridaChip,
  cobranzaPorAsesor,
  estadoPorCiclo,
  kpisFromMock,
} from '@/lib/mock-data-cobranza';
import { AnimatedNumber } from './components/AnimatedNumber';

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function CobranzaDashboardPage() {
  const k = kpisFromMock();
  const porAsesor = cobranzaPorAsesor();
  const porCiclo = estadoPorCiclo();

  const barData = porAsesor.map((r) => ({
    nombre: r.nombre.split(' ')[0],
    total: Math.round(r.total),
    recuperado: Math.round(r.recuperado),
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <p className="text-slate-400 text-sm">
        Vista consolidada de cartera — Instituto Meridian (demo)
      </p>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Cartera total</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            <AnimatedNumber value={k.carteraTotal} format={fmtMoney} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Al corriente</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
            <AnimatedNumber value={k.pctCorriente} decimals={1} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {k.nAlCorriente} alumnos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Monto en adeudo</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 tabular-nums">
            <AnimatedNumber value={k.montoAdeudo} format={fmtMoney} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Alumnos en riesgo de baja</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 tabular-nums">
            <AnimatedNumber value={k.riesgoBaja} />
          </p>
          <p className="text-xs text-slate-500 mt-1">alumnos en riesgo</p>
        </motion.div>
      </div>

      {/* Métricas menores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Tasa recuperación (mes)</p>
          <p className="text-xl font-semibold text-white mt-1">{k.tasaRecuperacionMes}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Promedio días atraso</p>
          <p className="text-xl font-semibold text-white mt-1">{k.promedioDiasAtraso} días</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Ciclo 4 críticos</p>
          <p className="text-xl font-semibold text-amber-300 mt-1">{k.ciclo4Criticos}</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[320px]">
          <h3 className="text-sm font-semibold text-white mb-4">Cobranza por Asesor</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="total" name="Total asignado" fill="#1e40af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recuperado" name="Recuperado" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[320px]">
          <h3 className="text-sm font-semibold text-white mb-4">Tendencia de Morosidad — Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={MOROSIDAD_TENDENCIA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[15, 24]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                formatter={(v: number) => [`${v}%`, 'Morosidad']}
              />
              <Area
                type="monotone"
                dataKey="pct"
                name="Morosidad"
                stroke="#ef4444"
                fill="rgba(239, 68, 68, 0.3)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla estado por ciclo */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-sm font-semibold">Estado por ciclo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-4 py-3 font-medium">Ciclo</th>
                <th className="px-4 py-3 font-medium">Alumnos</th>
                <th className="px-4 py-3 font-medium">Al corriente</th>
                <th className="px-4 py-3 font-medium">Adeudo</th>
                <th className="px-4 py-3 font-medium">Monto en riesgo</th>
                <th className="px-4 py-3 font-medium">Acción sugerida</th>
              </tr>
            </thead>
            <tbody>
              {porCiclo.map((row) => {
                const chip = accionSugeridaChip(row.ciclo);
                return (
                  <tr key={row.ciclo} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{row.ciclo}</td>
                    <td className="px-4 py-3 text-slate-300">{row.alumnos}</td>
                    <td className="px-4 py-3 text-emerald-400">{row.alCorriente}</td>
                    <td className="px-4 py-3 text-amber-300">{row.adeudo}</td>
                    <td className="px-4 py-3 text-slate-300">{fmtMoney(row.montoRiesgo)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${chip.className}`}>
                        {chip.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
