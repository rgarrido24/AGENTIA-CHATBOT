'use client';

import { motion } from 'framer-motion';
import PhoneMockup from '@/components/PhoneMockup';
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
    confirmada: 'bg-sky-100 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200',
    pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    completada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    cancelada: 'bg-zinc-100 text-zinc-500 dark:bg-slate-600/40 dark:text-slate-400',
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
    <>
      {/* Hero: PhoneMockup */}
      <section className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row items-center gap-10 px-2">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">Demo en vivo · Clínica Dental</p>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">
            Agenda citas dentales<br />
            <span className="text-sky-600 dark:text-sky-400">sin esperar llamadas</span>
          </h2>
          <p className="text-zinc-600 dark:text-slate-400 text-base max-w-md">
            El asistente recibe solicitudes, informa precios y horarios, y coordina citas — las 24 horas.
          </p>
          <ul className="space-y-2 text-sm text-zinc-700 dark:text-slate-300">
            {['Agendamiento automático de citas', 'Información de servicios y precios', 'Sin diagnósticos — siempre remite al dentista'].map(t => (
              <li key={t} className="flex items-center gap-2"><span className="text-sky-600 dark:text-sky-400">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="flex-shrink-0">
          <PhoneMockup
            businessName="Sonrisa Perfecta"
            businessEmoji="🦷"
            accentColor="#0ea5e9"
            apiRoute="/api/demo/dentista/chat"
            initialMessage="¡Hola! 🦷 Soy la asistente de la Clínica Dental Sonrisa Perfecta. ¿En qué puedo ayudarte hoy?"
            suggestedChips={['📅 Agendar cita', '💰 Ver precios', '🚨 Urgencia dental', '⏰ Horarios']}
          />
        </div>
      </section>

      {/* Dashboard */}
      <div id="panel-admin" className="space-y-8 max-w-7xl mx-auto">
      <p className="text-zinc-500 dark:text-slate-500 text-sm">{BRAND_DENTAL.nombre}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: hoy.length, color: 'text-sky-600 dark:text-sky-300' },
          { label: 'Pacientes activos', value: activos, color: 'text-cyan-600 dark:text-cyan-300' },
          { label: 'Cuentas por cobrar', value: cxp, format: fmt, color: 'text-amber-600 dark:text-amber-300' },
          { label: 'Tratamientos en curso', value: tCurso, color: 'text-fuchsia-600 dark:text-fuchsia-300' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5 shadow-sm dark:shadow-none"
          >
            <p className="text-zinc-500 dark:text-slate-500 text-sm">{k.label}</p>
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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Citas de hoy por dentista</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {porDentista.map((col) => (
            <div key={col.id} className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.03] p-4 min-h-[200px] shadow-sm dark:shadow-none">
              <p className="text-sky-600 dark:text-sky-400 font-medium text-sm mb-3">{col.nombre}</p>
              <div className="space-y-2">
                {col.citas.map((c) => {
                  const p = getP(c.pacienteId);
                  return (
                    <div key={c.id} className="text-xs border border-zinc-100 dark:border-white/5 rounded-lg px-2 py-2 text-zinc-700 dark:text-slate-300">
                      <span className="font-mono text-sky-600 dark:text-sky-300">{c.hora}</span> · {p?.nombre} · {c.tipo}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${badgeStatus(c.status)}`}>{c.status}</span>
                    </div>
                  );
                })}
                {col.citas.length === 0 && <p className="text-zinc-400 dark:text-slate-500 text-xs">Sin citas</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Alertas</h3>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mb-2">Saldo elevado (&gt; $2,000)</p>
          <ul className="text-xs space-y-1 text-zinc-700 dark:text-slate-300">
            {alertasSaldo.map((p) => (
              <li key={p.id}>
                {p.nombre} — {fmt(p.deuda)}
              </li>
            ))}
            {alertasSaldo.length === 0 && <li className="text-zinc-400 dark:text-slate-500">Ninguno</li>}
          </ul>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-3 mb-2">Citas próximas sin confirmar (pendiente)</p>
          <ul className="text-xs space-y-1 text-zinc-700 dark:text-slate-300">
            {alertasPend.slice(0, 5).map((c) => {
              const p = getP(c.pacienteId);
              return (
                <li key={c.id}>
                  {c.fecha} {c.hora} · {p?.nombre}
                </li>
              );
            })}
            {alertasPend.length === 0 && <li className="text-zinc-400 dark:text-slate-500">Ninguna</li>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.02] p-4 min-h-[260px] shadow-sm dark:shadow-none">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-slate-200 mb-4">Ingresos por tipo (citas completadas)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingTipo.length ? ingTipo : [{ name: '—', ingresos: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
              <Bar dataKey="ingresos" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.02] p-4 min-h-[260px] shadow-sm dark:shadow-none">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-slate-200 mb-4">Citas por mes (últimos 6)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mes6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b' }} />
              <YAxis tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="citas" stroke="#0284c7" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </>
  );
}
