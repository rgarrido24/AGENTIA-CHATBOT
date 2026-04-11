'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  MOCK_DIETAS_INICIALES,
  pacientesActivos,
  pacientesActivosEnRiesgo,
  pacientesMasActivosParaDashboard,
  promedioPerdidaPesoMesKg,
  SERIE_PROGRESO_GRUPO,
  sparklinePeso4Semanas,
  ultimaMedicion,
  variacionPesoUltimaSemana,
  heatmapActividad,
  ultimaAccionTexto,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from './nutricion-context';
import { useEffect, useRef, useState } from 'react';

const ACCENT = '#16a34a';
const AMBER = '#f59e0b';

// ── Panel de Actividad ────────────────────────────────────────────────────────
function CuadroHeatmap({ activo, diasSinRegistro, diaSemana, descripcion }: {
  activo: boolean;
  diasSinRegistro: number;
  diaSemana: string;
  descripcion: string;
}) {
  const [tip, setTip] = useState(false);
  const enRiesgo = diasSinRegistro >= 7 && !activo;

  return (
    <div className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <motion.div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        animate={enRiesgo ? { opacity: [1, 0.4, 1] } : {}}
        transition={enRiesgo ? { duration: 1.4, repeat: Infinity } : {}}
        style={{
          background: activo ? '#16a34a' : enRiesgo ? '#ef4444' : '#1e293b',
          border: `1px solid ${activo ? '#15803d' : enRiesgo ? '#dc2626' : '#334155'}`,
        }}
      />
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 whitespace-nowrap shadow-xl">
              <p className="font-semibold text-slate-100">{diaSemana}</p>
              <p className="text-slate-400">{descripcion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelActividad({ pacientes }: { pacientes: ReturnType<typeof pacientesActivos> }) {
  const badgeStatus = (status: string) => {
    if (status === 'activo') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">Activo</span>;
    if (status === 'pausado') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">Pausado</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Completado</span>;
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-white">📱 Actividad de Pacientes — Últimos 14 días</h2>
        <p className="text-xs text-slate-500 mt-0.5">Registro en tiempo real de la interacción de cada paciente con el sistema</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Header de columnas */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Paciente</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Últimos 14 días</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Último registro</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {pacientes.map((p, i) => {
            const heatmap = heatmapActividad(p.id);
            const ultimaAccion = ultimaAccionTexto(p);
            const enRiesgo = p.diasSinRegistro >= 7;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-center px-4 py-3 ${enRiesgo ? 'bg-red-950/10' : ''}`}
              >
                {/* Columna 1: Avatar + nombre */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: enRiesgo ? '#7f1d1d' : '#14532d' }}
                  >
                    {p.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.nombre}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.objetivo}</p>
                  </div>
                </div>

                {/* Columna 2: Heatmap */}
                <div className="flex gap-0.5 items-center">
                  {heatmap.map((h) => (
                    <CuadroHeatmap
                      key={h.fecha}
                      activo={h.activo}
                      diasSinRegistro={p.diasSinRegistro}
                      diaSemana={h.diaSemana}
                      descripcion={h.descripcion}
                    />
                  ))}
                </div>

                {/* Columna 3: Último registro */}
                <p className={`text-xs truncate ${
                  p.diasSinRegistro === 0 ? 'text-emerald-400' :
                  p.diasSinRegistro === 1 ? 'text-yellow-400' :
                  p.diasSinRegistro <= 6  ? 'text-orange-400' :
                  'text-red-400 font-semibold'
                }`}>
                  {ultimaAccion}
                </p>

                {/* Columna 4: Badge */}
                <div>{badgeStatus(p.status)}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Nota al pie */}
        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.015]">
          <p className="text-[10px] text-slate-500">
            💡 Los pacientes registran desde WhatsApp — solo escriben al número del consultorio y el sistema guarda todo automáticamente. Sin apps, sin fricción.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Tipos ──────────────────────────────────────────────────────────────────────
type ListaItem = { alimento: string; cantidad: string; unidad: string };
type ListaSeccion = { nombre: string; emoji: string; items: ListaItem[] };
type ListaSuper = { secciones: ListaSeccion[]; calorias_diarias: number; semana: string };

// ── Modal de Lista del Súper ──────────────────────────────────────────────────
function ModalListaSuper({
  pacienteNombre,
  lista,
  onClose,
}: {
  pacienteNombre: string;
  lista: ListaSuper;
  onClose: () => void;
}) {
  const STORAGE_KEY = `nutri-super-${pacienteNombre.replace(/\s+/g, '-').toLowerCase()}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked, STORAGE_KEY]);

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleWhatsApp() {
    const lines: string[] = [`🛒 Tu lista del súper — ${lista.semana}\n`];
    for (const sec of lista.secciones) {
      lines.push(`${sec.emoji} ${sec.nombre}:`);
      for (const it of sec.items) {
        lines.push(`  - ${it.alimento}: ${it.cantidad} ${it.unidad}`);
      }
      lines.push('');
    }
    lines.push('Enviado por NutriVida con ❤️');
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function handleCopy() {
    const lines: string[] = [`🛒 Lista del súper — ${lista.semana}\n`];
    for (const sec of lista.secciones) {
      lines.push(`${sec.emoji} ${sec.nombre}:`);
      for (const it of sec.items) {
        lines.push(`  - ${it.alimento}: ${it.cantidad} ${it.unidad}`);
      }
      lines.push('');
    }
    void navigator.clipboard.writeText(lines.join('\n'));
  }

  const total = lista.secciones.flatMap((s) => s.items).length;
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
          <div>
            <p className="text-white font-semibold text-base">🛒 Lista del súper — {pacienteNombre}</p>
            <p className="text-slate-400 text-xs mt-0.5">{lista.semana} · {lista.calorias_diarias} kcal/día</p>
            {total > 0 && (
              <div className="mt-2 h-1.5 w-40 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(done / total) * 100}%`, background: ACCENT }}
                />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none flex-shrink-0 mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Secciones */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {lista.secciones.map((sec) => (
            <div key={sec.nombre}>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {sec.emoji} {sec.nombre}
              </p>
              <ul className="space-y-1.5">
                {sec.items.map((it) => {
                  const key = `${sec.nombre}::${it.alimento}`;
                  const done = !!checked[key];
                  return (
                    <li
                      key={key}
                      onClick={() => toggle(key)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <span
                        className="w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center text-[10px]"
                        style={{
                          borderColor: done ? ACCENT : 'rgba(255,255,255,0.2)',
                          background: done ? ACCENT : 'transparent',
                        }}
                      >
                        {done && '✓'}
                      </span>
                      <span className={`flex-1 text-sm ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {it.alimento}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {it.cantidad} {it.unidad}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-white/10">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ background: '#25D366' }}
          >
            📱 Enviar por WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="px-4 rounded-xl text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/15 transition-colors"
          >
            📋 Copiar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Fila de paciente con botón lista del súper ────────────────────────────────
function FilaPacienteSuper({ pacienteId }: { pacienteId: string }) {
  const p = MOCK_PACIENTES.find((x) => x.id === pacienteId)!;
  const d = MOCK_DIETAS_INICIALES().find((x) => x.pacienteId === pacienteId) ?? MOCK_DIETAS_INICIALES()[0]!;
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState<ListaSuper | null>(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  async function generarLista() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo/nutricion/lista-super', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `Error ${res.status}`);
      setLista(json.lista as ListaSuper);
      setModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar la lista');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-300 truncate">{p.nombre}</p>
          <p className="text-xs text-slate-500 truncate">{d.nombre} · {d.calorias} kcal</p>
          {error && <p className="text-xs text-red-400 mt-0.5 truncate">{error}</p>}
        </div>
        <button
          onClick={lista ? () => setModalOpen(true) : generarLista}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ background: loading ? '#334155' : ACCENT }}
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border border-white/40 border-t-white rounded-full" />
              Calculando…
            </>
          ) : (
            <>🛒 {lista ? 'Ver lista' : 'Generar lista'}</>
          )}
        </button>
      </div>

      <AnimatePresence>
        {modalOpen && lista && (
          <ModalListaSuper
            pacienteNombre={p.nombre}
            lista={lista}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

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

        <PanelActividad pacientes={MOCK_PACIENTES} />

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

        {/* ── Lista del Súper por Paciente ────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">🛒 Lista del súper semanal</h2>
          <p className="text-xs text-slate-500 mb-3">
            Genera la lista de compras para 7 días basada en el plan de cada paciente y el SMAE.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {MOCK_PACIENTES.slice(0, 6).map((p) => (
              <FilaPacienteSuper key={p.id} pacienteId={p.id} />
            ))}
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
