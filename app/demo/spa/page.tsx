'use client';

import { motion } from 'framer-motion';
import PhoneMockup from '@/components/PhoneMockup';
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
  BRAND_SPA,
  citasHoy,
  clientesVIPCount,
  especialistaMasSolicitadaStats,
  FECHA_REF_DASHBOARD,
  getCliente,
  getEspecialista,
  getServicio,
  ingresosCompletadosHoy,
  ingresosPorCategoria,
  MOCK_CLIENTES,
  MOCK_ESPECIALISTAS,
  topServiciosSolicitados,
  type Cita,
} from '@/lib/mock-data-spa';
import { useSpa } from './spa-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function statusBadge(s: Cita['status']) {
  const m: Record<Cita['status'], string> = {
    confirmada: 'bg-violet-500/25 text-violet-200 border-violet-500/40',
    pendiente: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    completada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    cancelada: 'bg-slate-600/40 text-slate-400 border-slate-500/40',
  };
  const labels: Record<Cita['status'], string> = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m[s]}`}>{labels[s]}</span>
  );
}

export default function SpaDashboardPage() {
  const { citas } = useSpa();
  const hoy = citasHoy(citas, FECHA_REF_DASHBOARD);
  const ordenadas = [...hoy].sort((a, b) => a.hora.localeCompare(b.hora));
  const ingresos = ingresosCompletadosHoy(citas, FECHA_REF_DASHBOARD);
  const vip = clientesVIPCount(MOCK_CLIENTES);
  const topEspStats = especialistaMasSolicitadaStats(citas);
  const topServ = topServiciosSolicitados(citas, 5);
  const donut = ingresosPorCategoria(citas);

  return (
    <>
      {/* Hero: PhoneMockup */}
      <section className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row items-center gap-10 px-2">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Demo en vivo · Lumina Spa</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Tu asistente de spa<br />
            <span className="text-purple-400">disponible 24/7</span>
          </h2>
          <p className="text-slate-400 text-base max-w-md">
            Agenda citas, consulta precios y resuelve dudas automáticamente. Prueba el chat en vivo — es el bot real.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Agendamiento paso a paso', 'Catálogo de servicios y precios', 'Respuestas en segundos, 24/7'].map(t => (
              <li key={t} className="flex items-center gap-2"><span className="text-purple-400">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="flex-shrink-0">
          <PhoneMockup
            businessName="Lumina Spa & Estética"
            businessEmoji="💜"
            accentColor="#9333ea"
            apiRoute="/api/demo/spa/chat"
            initialMessage="¡Hola! 💜 Soy la asistente de Lumina Spa. ¿Te gustaría conocer nuestros servicios o agendar una cita?"
            suggestedChips={['💆 Ver servicios', '📅 Agendar cita', '💰 Ver precios', '🎁 Promociones del mes']}
          />
        </div>
      </section>

      {/* Dashboard */}
      <div id="panel-admin" className="space-y-8 max-w-7xl mx-auto">
      <p className="text-slate-500 text-sm">{BRAND_SPA.nombre} — resumen del día</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: hoy.length, color: 'text-fuchsia-400' },
          { label: 'Ingresos del día (completadas)', value: ingresos, format: fmt, color: 'text-violet-300' },
          { label: 'Clientes VIP', value: vip, color: 'text-pink-400' },
          {
            label: 'Especialista más solicitada',
            value: topEspStats?.count ?? 0,
            sub: topEspStats?.especialista.nombre ?? '—',
            color: 'text-purple-300',
          },
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
            {'sub' in k && k.sub && <p className="text-xs text-slate-500 mt-1">{k.sub}</p>}
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Timeline — citas de hoy</h2>
        <div className="space-y-2">
          {ordenadas.map((c) => {
            const cli = getCliente(c.clienteId);
            const srv = getServicio(c.servicioId);
            const esp = getEspecialista(c.especialistaId);
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="font-mono text-fuchsia-300 font-bold w-14">{c.hora}</span>
                <span className="text-white font-medium">{esp?.nombre}</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-300">{srv?.nombre}</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-400">{cli?.nombre}</span>
                <span className="text-slate-500 text-sm">{c.duracion} min</span>
                <span className="text-pink-300 text-sm">{fmt(c.precio)}</span>
                {statusBadge(c.status)}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Especialistas</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {MOCK_ESPECIALISTAS.map((e) => (
            <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <div className="text-4xl mb-2">{e.foto}</div>
              <p className="font-semibold text-white text-sm">{e.nombre}</p>
              <p className="text-[11px] mt-1">
                <span className={e.disponibleAhora ? 'text-emerald-400' : 'text-amber-400'}>
                  ● {e.disponibleAhora ? 'Disponible' : 'En servicio'}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Turno {e.turno}</p>
              <p className="text-xs text-fuchsia-300 mt-1">{e.citas_hoy} citas hoy</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[300px]">
          <h3 className="text-sm font-semibold mb-2">Servicios más solicitados</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={topServ.map((x) => ({ name: x.nombre.slice(0, 18), citas: x.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey="citas" fill="#9333ea" radius={[4, 4, 0, 0]} name="Citas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[300px]">
          <h3 className="text-sm font-semibold mb-2">Ingresos por categoría (completadas)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={donut.length ? donut : [{ name: 'N/D', value: 1, fill: '#9333ea' }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
              >
                {(donut.length ? donut : [{ name: 'N/D', value: 1, fill: '#9333ea' }]).map((e, i) => (
                  <Cell key={i} fill={'fill' in e ? e.fill : '#9333ea'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </>
  );
}
