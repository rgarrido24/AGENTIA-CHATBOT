'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PhoneMockup from '@/components/PhoneMockup';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatedNumber } from '@/app/demo/cobranza/components/AnimatedNumber';
import {
  BRAND_NUTRICION,
  MOCK_CITAS_SEMANA,
  MOCK_PACIENTES,
  pacientesActivos,
  pacientesActivosEnRiesgo,
  pacientesMasActivosParaDashboard,
  promedioPerdidaPesoMesKg,
  SERIE_PROGRESO_GRUPO,
  sparklinePeso4Semanas,
  ultimaMedicion,
  variacionPesoUltimaSemana,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from './nutricion-context';

const ACCENT = '#16a34a';
const AMBER = '#f59e0b';

function nombreCorto(id: string) {
  return MOCK_PACIENTES.find((p) => p.id === id)?.nombre.split(' ')[0] ?? '';
}

export default function NutricionDashboardPage() {
  const { mediciones, logros } = useNutricion();
  const activos = pacientesActivos().length;
  const promMes = promedioPerdidaPesoMesKg(mediciones);
  const riesgo = pacientesActivosEnRiesgo(7);
  const logrosMes = logros.filter((l) => l.fecha.startsWith('2026-03')).length;
  const top5 = pacientesMasActivosParaDashboard(5, mediciones);
  const feedShow = [...logros].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);

  return (
    <>
      <section className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row items-center gap-10 px-2">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
            Demo en vivo · {BRAND_NUTRICION.centro}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {BRAND_NUTRICION.tagline}
            <br />
            <span style={{ color: AMBER }}>Progreso real, sin abandono</span>
          </h2>
          <p className="text-slate-400 text-base max-w-md">
            Acompañamiento y motivación: tableros, recordatorios y una IA que conoce el plan de cada paciente.
          </p>
        </div>
        <div className="flex-shrink-0">
          <PhoneMockup
            businessName="NutriVida"
            businessEmoji="💚"
            accentColor={ACCENT}
            apiRoute="/api/demo/nutricion/chat"
            initialMessage={
              '¡Hola! 💚 Soy tu asistente de NutriVida.\n' +
              'Puedo ayudarte con tu dieta, sustituciones de alimentos\n' +
              'y a mantenerte motivado/a. ¿En qué te ayudo hoy?'
            }
            suggestedChips={[
              '🥗 ¿Puedo comer aguacate?',
              '💪 ¿Cuánto he bajado?',
              '🍕 Me antojó pizza, ¿qué hago?',
              '⭐ Ver mi progreso',
            ]}
          />
        </div>
      </section>

      <div id="panel-admin" className="space-y-8 max-w-7xl mx-auto">
        {riesgo.length > 0 && (
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 6px rgba(239,68,68,0.15)', '0 0 0 0 rgba(239,68,68,0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-xl border border-red-500/50 bg-red-950/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <span className="text-2xl">⚠️</span>
            <p className="text-sm text-red-100 flex-1">
              <strong>{riesgo.length} paciente{riesgo.length === 1 ? '' : 's'}</strong> llevan más de 7 días sin
              registrar mediciones. El abandono empieza aquí.
            </p>
            <Link
              href="/demo/nutricion/pacientes?filtro=riesgo"
              className="text-sm font-semibold text-white underline decoration-red-400 whitespace-nowrap"
            >
              Ver pacientes en riesgo →
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Pacientes activos', value: activos, color: 'text-emerald-300', decimals: 0 as const },
            {
              label: 'Pérdida promedio este mes',
              value: promMes,
              color: 'text-amber-300',
              decimals: 1 as const,
              suffix: ' kg',
            },
            {
              label: 'En riesgo de abandono',
              value: riesgo.length,
              color: 'text-red-300',
              decimals: 0 as const,
            },
            {
              label: 'Logros este mes',
              value: logrosMes,
              color: 'text-lime-300',
              decimals: 0 as const,
              suffix: ' 🏆',
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
                <AnimatedNumber
                  value={k.value}
                  decimals={'decimals' in k ? k.decimals : 0}
                  suffix={'suffix' in k && k.suffix ? k.suffix : ''}
                />
              </p>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Progreso de la semana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {top5.map((p) => {
              const spark = sparklinePeso4Semanas(p.id, mediciones);
              const data = spark.map((s) => ({ w: s.semana, peso: s.peso }));
              const v = variacionPesoUltimaSemana(p.id, mediciones);
              const ult = ultimaMedicion(p.id, mediciones);
              return (
                <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-emerald-400 font-medium text-sm truncate">{p.nombre}</p>
                  <p className="text-[10px] text-slate-500 mb-2">{p.objetivo}</p>
                  <div className="h-[72px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.length ? data : [{ w: '—', peso: ult?.peso ?? 0 }]}>
                        <Line
                          type="monotone"
                          dataKey="peso"
                          stroke={ACCENT}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs mt-2">
                    {v < -0.05 ? (
                      <span className="text-emerald-400">↓ {Math.abs(v)}kg esta semana</span>
                    ) : v > 0.05 ? (
                      <span className="text-amber-300">↑ {v}kg esta semana</span>
                    ) : (
                      <span className="text-slate-500">→ Sin cambios</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Logros recientes</h2>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {feedShow.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-white/10 bg-gradient-to-r from-emerald-950/40 to-transparent p-4 text-sm text-slate-200"
                >
                  <span className="mr-2">{l.emoji}</span>
                  {l.descripcion}
                  <span className="block text-[10px] text-slate-500 mt-1">{l.fecha}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Calendario de la semana (lun–vie)</h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4 max-h-[320px] overflow-y-auto">
              {['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21'].map((d) => {
                const citas = MOCK_CITAS_SEMANA.filter((c) => c.fecha === d);
                const label = new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <div key={d}>
                    <p className="text-xs font-semibold text-emerald-400 capitalize mb-2">{label}</p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {citas.map((c) => (
                        <li key={c.id} className="flex justify-between gap-2 border border-white/5 rounded-lg px-2 py-1.5">
                          <span className="font-mono text-emerald-300">{c.hora}</span>
                          <span className="truncate">{nombreCorto(c.pacienteId)}</span>
                          <span className="text-slate-500 truncate">{c.motivo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-[300px]">
          <h3 className="text-sm font-semibold mb-2">Progreso promedio del grupo (tendencia del consultorio)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <ComposedChart data={SERIE_PROGRESO_GRUPO}>
              <defs>
                <linearGradient id="nutriFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
              <XAxis dataKey="semana" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" kg" />
              <Tooltip
                formatter={(v: number) => [`${v} kg`, 'Pérdida acum. prom.']}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
              />
              <Area
                type="monotone"
                dataKey="kgPerdidaPromedio"
                stroke="none"
                fill="url(#nutriFill)"
              />
              <Line
                type="monotone"
                dataKey="kgPerdidaPromedio"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{ r: 3, fill: ACCENT }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
