'use client';

import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import {
  BRAND_GROOMING,
  citasHoyG,
  domiciliosActivosHoy,
  FECHA_REF_GROOMING,
  getGroomer,
  getMascota,
  getServicioG,
  ingresosCompletadosHoyG,
  ingresosPorTamaño,
  mascotasAtendidasHoy,
  MOCK_GROOMERS,
  topServiciosGrooming,
  type CitaGrooming,
} from '@/lib/mock-data-grooming';
import { useGrooming } from './grooming-context';

const ACCENT = '#f97316';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function statusBadge(s: CitaGrooming['status']) {
  const m: Record<CitaGrooming['status'], string> = {
    pendiente: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    confirmada: 'bg-orange-500/25 text-orange-200 border-orange-500/40',
    en_camino: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    atendiendo: 'bg-violet-500/25 text-violet-200 border-violet-500/40',
    completada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    cancelada: 'bg-slate-600/40 text-slate-400 border-slate-500/40',
  };
  const labels: Record<CitaGrooming['status'], string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_camino: 'En camino',
    atendiendo: 'Atendiendo',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m[s]}`}>{labels[s]}</span>
  );
}

export default function GroomingDashboardPage() {
  const { citas } = useGrooming();
  const hoy = citasHoyG(citas, FECHA_REF_GROOMING);
  const ordenadas = [...hoy].sort((a, b) => a.hora.localeCompare(b.hora));
  const ingresos = ingresosCompletadosHoyG(citas, FECHA_REF_GROOMING);
  const mascotasOk = mascotasAtendidasHoy(citas, FECHA_REF_GROOMING);
  const domAct = domiciliosActivosHoy(citas, FECHA_REF_GROOMING);
  const topServ = topServiciosGrooming(citas, 5);
  const donut = ingresosPorTamaño(citas);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <p className="text-slate-500 text-sm">{BRAND_GROOMING.nombre} — resumen del día</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: hoy.length, color: 'text-orange-300' },
          { label: 'Ingresos del día (completadas)', value: ingresos, format: fmt, color: 'text-amber-300' },
          { label: 'Mascotas atendidas', value: mascotasOk, color: 'text-orange-400' },
          { label: 'Domicilios activos', value: domAct, color: 'text-yellow-300' },
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
        <h2 className="text-sm font-semibold text-white mb-3">Timeline — citas de hoy</h2>
        <div className="space-y-2">
          {ordenadas.map((c) => {
            const mas = getMascota(c.mascotaId);
            const srv = getServicioG(c.servicioId);
            const gr = getGroomer(c.groomerId);
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="text-2xl" title={mas?.nombre}>
                  {mas?.foto}
                </span>
                <span className="font-mono text-orange-300 font-bold w-14">{c.hora}</span>
                <span className="text-white font-medium">{gr?.nombre}</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-300">{srv?.nombre}</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-400">{mas?.nombre}</span>
                <span className="text-[10px] text-slate-500 ml-auto">{c.modalidad === 'domicilio' ? '🚐 Dom' : '🏪 Suc'}</span>
                {statusBadge(c.status)}
              </div>
            );
          })}
          {ordenadas.length === 0 && <p className="text-slate-500 text-sm">Sin citas para hoy.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Groomers hoy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MOCK_GROOMERS.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
            >
              <div className="text-4xl mb-2">{g.foto}</div>
              <p className="font-medium">{g.nombre}</p>
              <p className={`text-xs mt-1 ${g.disponibleAhora ? 'text-emerald-400' : 'text-slate-500'}`}>
                {g.disponibleAhora ? '● Disponible' : '● Ocupada'}
              </p>
              <p className="text-xs text-slate-500 mt-1">{g.citas_hoy} citas hoy</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02] min-h-[280px]">
          <h3 className="text-sm font-semibold mb-4">Servicios más solicitados</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topServ} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="nombre" width={120} stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} name="Citas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02] min-h-[280px]">
          <h3 className="text-sm font-semibold mb-4">Ingresos por tamaño (completadas)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={donut.length ? donut : [{ name: 'Sin datos', value: 1, fill: '#334155' }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {(donut.length ? donut : [{ name: 'Sin datos', value: 1, fill: '#334155' }]).map((e, i) => (
                  <Cell key={i} fill={'fill' in e ? e.fill : ACCENT} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
