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
  BRAND_MEDICO,
  MEDICOS,
  citasHoyM,
  citasPorMes6,
  cuentasPorCobrarTotal,
  HOY_MED,
  ingresosPorTipoCita,
  tratamientosEnCurso,
  type Cita,
} from '@/lib/mock-data-medico';
import { useMedico } from './medico-context';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function badgeStatus(c: Cita['status']) {
  const m: Record<Cita['status'], string> = {
    confirmada: 'bg-emerald-500/25 text-emerald-200',
    pendiente: 'bg-amber-500/20 text-amber-200',
    completada: 'bg-sky-500/20 text-sky-200',
    cancelada: 'bg-slate-600/40 text-slate-400',
  };
  return m[c];
}

export default function MedicoDashboardPage() {
  const { pacientes, consultas, citas } = useMedico();
  const getP = (id: string) => pacientes.find((x) => x.id === id);
  const hoy = citasHoyM(citas, HOY_MED);
  const activos = pacientes.length;
  const cxp = cuentasPorCobrarTotal(pacientes);
  const tCurso = tratamientosEnCurso(consultas);
  const ingTipo = ingresosPorTipoCita(citas).map((x) => ({ name: x.name, ingresos: x.value }));
  const mes6 = citasPorMes6();

  const porMedico = MEDICOS.map((d) => ({
    ...d,
    citas: hoy.filter((c) => c.medico === d.nombre).sort((a, b) => a.hora.localeCompare(b.hora)),
  }));

  const alertasSaldo = pacientes.filter((p) => p.deuda > 2000);
  const alertasPend = citas.filter((c) => c.status === 'pendiente' && c.fecha >= HOY_MED);

  return (
    <>
      {/* Hero: PhoneMockup */}
      <section className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row items-center gap-10 px-2">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Demo en vivo · Centro Médico</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Consultas médicas<br />
            <span className="text-emerald-400">agendadas sin llamadas</span>
          </h2>
          <p className="text-slate-400 text-base max-w-md">
            El asistente agenda consultas, informa especialidades y horarios, y envía recordatorios — automáticamente.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Agendamiento por especialidad', 'Precios orientativos incluidos', 'Nunca da diagnósticos — siempre remite al médico'].map(t => (
              <li key={t} className="flex items-center gap-2"><span className="text-emerald-400">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="flex-shrink-0">
          <PhoneMockup
            businessName="Centro Médico Salud+"
            businessEmoji="🏥"
            accentColor="#10b981"
            apiRoute="/api/demo/medico/chat"
            initialMessage="¡Hola! 🏥 Soy el asistente del Centro Médico Salud+. ¿Quieres agendar una consulta o tienes alguna pregunta?"
            suggestedChips={['📅 Agendar consulta', '🩺 Ver especialidades', '💰 Precios', '🚨 Urgencias']}
          />
        </div>
      </section>

      {/* Dashboard */}
      <div id="panel-admin" className="space-y-8 max-w-7xl mx-auto">
      <p className="text-slate-500 text-sm">{BRAND_MEDICO.nombre}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: hoy.length, color: 'text-emerald-300' },
          { label: 'Pacientes activos', value: activos, color: 'text-green-300' },
          { label: 'Cuentas por cobrar', value: cxp, format: fmt, color: 'text-amber-300' },
          { label: 'Tratamientos en curso', value: tCurso, color: 'text-lime-300' },
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
        <h2 className="text-sm font-semibold text-white mb-3">Citas de hoy por médico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {porMedico.map((col) => (
            <div key={col.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 min-h-[200px]">
              <p className="text-emerald-400 font-medium text-sm mb-3">{col.nombre}</p>
              <p className="text-[10px] text-slate-500 mb-2">{col.especialidad}</p>
              <div className="space-y-2">
                {col.citas.map((c) => {
                  const p = getP(c.pacienteId);
                  return (
                    <div key={c.id} className="text-xs border border-white/5 rounded-lg px-2 py-2">
                      <span className="font-mono text-emerald-300">{c.hora}</span> · {p?.nombre} · {c.tipo}
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
          <p className="text-xs text-slate-400 mt-4 mb-2">Citas sin confirmar (pendientes)</p>
          <ul className="text-xs space-y-1">
            {alertasPend.slice(0, 6).map((c) => (
              <li key={c.id}>
                {getP(c.pacienteId)?.nombre} — {c.fecha} {c.hora}
              </li>
            ))}
            {alertasPend.length === 0 && <li className="text-slate-500">Ninguna</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[280px]">
          <h3 className="text-sm font-semibold mb-2">Ingresos por tipo de cita (completadas)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={ingTipo.length ? ingTipo : [{ name: '—', value: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[300px]">
        <h3 className="text-sm font-semibold mb-2">Citas por mes (últimos 6)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={mes6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
            <XAxis dataKey="mes" tick={{ fill: '#94a3b8' }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
            <Line type="monotone" dataKey="citas" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div>
    </>
  );
}
