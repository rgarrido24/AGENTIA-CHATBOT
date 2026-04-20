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
import { useNutricionTheme } from './nutricion-theme-context';
import type { LoyaltyCardData } from '@/app/demo/barber/LoyaltyCard';

const DEMO_LOYALTY_NUTRI: LoyaltyCardData = {
  clienteNombre: 'Lucía Flores',
  clienteId: 'Nu-0055',
  negocio: 'NutriVida',
  giro: 'nutricion',
  visitas: 2,
  meta: 4,
  ultimoServicio: 'Consulta de seguimiento',
  recompensaNombre: 'consulta nutricional',
};
import { useCallback, useEffect, useRef, useState } from 'react';

const ACCENT = '#16a34a';
const AMBER = '#f59e0b';

function CuadroHeatmap({ activo, diasSinRegistro, diaSemana, descripcion }: {
  activo: boolean; diasSinRegistro: number; diaSemana: string; descripcion: string;
}) {
  const { colors } = useNutricionTheme();
  const [tip, setTip] = useState(false);
  const enRiesgo = diasSinRegistro >= 7 && !activo;
  return (
    <div className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <motion.div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        animate={enRiesgo ? { opacity: [1, 0.4, 1] } : {}}
        transition={enRiesgo ? { duration: 1.4, repeat: Infinity } : {}}
        style={{
          background: activo ? '#16a34a' : enRiesgo ? '#ef4444' : colors.cardBgAlt,
          border: `1px solid ${activo ? '#15803d' : enRiesgo ? '#dc2626' : colors.border}`,
        }}
      />
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.1 }}
            className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div
              className="rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap shadow-xl"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              <p className="font-semibold">{diaSemana}</p>
              <p style={{ color: colors.textSecondary }}>{descripcion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelActividad({ pacientes }: { pacientes: ReturnType<typeof pacientesActivos> }) {
  const { colors } = useNutricionTheme();

  const badgeStatus = (status: string) => {
    if (status === 'activo') return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>Activo</span>
    );
    if (status === 'pausado') return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Pausado</span>
    );
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}` }}>Completado</span>;
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>📱 Actividad de Pacientes — Últimos 14 días</h2>
        <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Registro en tiempo real de la interacción de cada paciente con el sistema</p>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}`, background: colors.cardBg }}>
        <div
          className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 px-4 py-2"
          style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cardBgAlt }}
        >
          {['Paciente', 'Últimos 14 días', 'Último registro', 'Status'].map((h) => (
            <p key={h} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{h}</p>
          ))}
        </div>
        <div style={{ borderColor: colors.divider }}>
          {pacientes.map((p, i) => {
            const heatmap = heatmapActividad(p.id);
            const ultimaAccion = ultimaAccionTexto(p);
            const enRiesgo = p.diasSinRegistro >= 7;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-center px-4 py-3"
                style={{
                  borderBottom: `1px solid ${colors.divider}`,
                  background: enRiesgo ? 'rgba(239,68,68,0.06)' : undefined,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: enRiesgo ? '#7f1d1d' : '#14532d' }}
                  >
                    {p.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{p.nombre}</p>
                    <p className="text-[10px] truncate" style={{ color: colors.textMuted }}>{p.objetivo}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 items-center">
                  {heatmap.map((h) => (
                    <CuadroHeatmap key={h.fecha} activo={h.activo} diasSinRegistro={p.diasSinRegistro} diaSemana={h.diaSemana} descripcion={h.descripcion} />
                  ))}
                </div>
                <p className={`text-xs truncate ${
                  p.diasSinRegistro === 0 ? 'text-emerald-500' :
                  p.diasSinRegistro === 1 ? 'text-yellow-500' :
                  p.diasSinRegistro <= 6  ? 'text-orange-500' :
                  'text-red-500 font-semibold'
                }`}>{ultimaAccion}</p>
                <div>{badgeStatus(p.status)}</div>
              </motion.div>
            );
          })}
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${colors.divider}`, background: colors.cardBgAlt }}>
          <p className="text-[10px]" style={{ color: colors.textMuted }}>
            💡 Los pacientes registran desde WhatsApp — solo escriben al número del consultorio y el sistema guarda todo automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

type ListaItem = { alimento: string; cantidad: string; unidad: string };
type ListaSeccion = { nombre: string; emoji: string; items: ListaItem[] };
type ListaSuper = { secciones: ListaSeccion[]; calorias_diarias: number; semana: string };

function ModalListaSuper({ pacienteNombre, lista, onClose }: { pacienteNombre: string; lista: ListaSuper; onClose: () => void }) {
  const { colors } = useNutricionTheme();
  const STORAGE_KEY = `nutri-super-${pacienteNombre.replace(/\s+/g, '-').toLowerCase()}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)); }, [checked, STORAGE_KEY]);

  function toggle(key: string) { setChecked((prev) => ({ ...prev, [key]: !prev[key] })); }

  function handleWhatsApp() {
    const lines: string[] = [`🛒 Tu lista del súper — ${lista.semana}\n`];
    for (const sec of lista.secciones) {
      lines.push(`${sec.emoji} ${sec.nombre}:`);
      for (const it of sec.items) lines.push(`  - ${it.alimento}: ${it.cantidad} ${it.unidad}`);
      lines.push('');
    }
    lines.push('Enviado por NutriVida con ❤️');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  const total = lista.secciones.flatMap((s) => s.items).length;
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-start justify-between gap-3 p-5" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <p className="font-semibold text-base" style={{ color: colors.textPrimary }}>🛒 Lista del súper — {pacienteNombre}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{lista.semana} · {lista.calorias_diarias} kcal/día</p>
            {total > 0 && (
              <div className="mt-2 h-1.5 w-40 rounded-full overflow-hidden" style={{ background: colors.border }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(done / total) * 100}%`, background: ACCENT }} />
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-xl leading-none flex-shrink-0 mt-0.5" style={{ color: colors.textMuted }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {lista.secciones.map((sec) => (
            <div key={sec.nombre}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>{sec.emoji} {sec.nombre}</p>
              <ul className="space-y-1.5">
                {sec.items.map((it) => {
                  const key = `${sec.nombre}::${it.alimento}`;
                  const isDone = !!checked[key];
                  return (
                    <li
                      key={key} onClick={() => toggle(key)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                      style={{ background: isDone ? colors.accentSoft : undefined }}
                    >
                      <span className="w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center text-[10px]"
                        style={{ borderColor: isDone ? ACCENT : colors.border, background: isDone ? ACCENT : 'transparent', color: '#fff' }}>
                        {isDone && '✓'}
                      </span>
                      <span className="flex-1 text-sm" style={{ color: isDone ? colors.textMuted : colors.textPrimary, textDecoration: isDone ? 'line-through' : 'none' }}>{it.alimento}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: colors.textMuted }}>{it.cantidad} {it.unidad}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <button onClick={handleWhatsApp} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: '#25D366' }}>
            📱 Enviar por WhatsApp
          </button>
          <button onClick={() => void navigator.clipboard.writeText('')}
            className="px-4 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}` }}>
            📋 Copiar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FilaPacienteSuper({ pacienteId }: { pacienteId: string }) {
  const { colors } = useNutricionTheme();
  const p = MOCK_PACIENTES.find((x) => x.id === pacienteId)!;
  const d = MOCK_DIETAS_INICIALES().find((x) => x.pacienteId === pacienteId) ?? MOCK_DIETAS_INICIALES()[0]!;
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState<ListaSuper | null>(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  async function generarLista() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/demo/nutricion/lista-super', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `Error ${res.status}`);
      setLista(json.lista as ListaSuper);
      setModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar la lista');
    } finally { setLoading(false); }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        style={{ border: `1px solid ${colors.border}`, background: colors.cardBg, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: ACCENT }}>{p.nombre}</p>
          <p className="text-xs truncate" style={{ color: colors.textMuted }}>{d.nombre} · {d.calorias} kcal</p>
          {error && <p className="text-xs text-red-500 mt-0.5 truncate">{error}</p>}
        </div>
        <button
          onClick={lista ? () => setModalOpen(true) : generarLista} disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ background: loading ? colors.border : ACCENT }}
        >
          {loading ? <><span className="animate-spin inline-block w-3 h-3 border border-white/40 border-t-white rounded-full" />Calculando…</> : <>🛒 {lista ? 'Ver lista' : 'Generar lista'}</>}
        </button>
      </div>
      <AnimatePresence>
        {modalOpen && lista && <ModalListaSuper pacienteNombre={p.nombre} lista={lista} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function nombreCorto(id: string) {
  return MOCK_PACIENTES.find((p) => p.id === id)?.nombre.split(' ')[0] ?? '';
}

type CaloriaLog = { tiempo: string; calorias_estimadas: number; geminiRaw: string };

function RegistroCalorico() {
  const { colors } = useNutricionTheme();
  const [patientId, setPatientId] = useState('p01');
  const [logs, setLogs] = useState<CaloriaLog[]>([]);
  const [totalDia, setTotalDia] = useState(0);
  const [meta, setMeta] = useState(1800);
  const [fetched, setFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchLogs = useCallback(async (pid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/demo/nutricion/calorias?patientId=${pid}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotalDia(data.totalDia ?? 0);
      setMeta(data.meta ?? 1800);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLogs(patientId); }, [patientId, fetchLogs]);

  const simulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/demo/nutricion/calorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, simulate: true, tiempo: 'Comida' }),
      });
      if (res.ok) await fetchLogs(patientId);
    } finally {
      setSimulating(false);
    }
  };

  const pct = Math.min(100, Math.round((totalDia / meta) * 100));
  const barColor = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#16a34a';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>📸 Registro calórico por foto</h2>
          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>El paciente envía foto de su comida y la IA estima las calorías automáticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={patientId}
            onChange={(e) => { setPatientId(e.target.value); setFetched(false); }}
            className="rounded-lg px-2 py-1 text-xs"
            style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          >
            {MOCK_PACIENTES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button
            onClick={() => void simulate()}
            disabled={simulating}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: simulating ? colors.border : '#16a34a' }}
          >
            {simulating ? <><span className="animate-spin inline-block w-3 h-3 border border-white/40 border-t-white rounded-full" />Analizando…</> : '📸 Simular foto'}
          </button>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}`, background: colors.cardBg }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              {MOCK_PACIENTES.find((p) => p.id === patientId)?.nombre} — Hoy
            </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{totalDia} / {meta} kcal ({pct}%)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.cardBgAlt }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>
        {loading && !fetched ? (
          <p className="text-center text-xs py-6" style={{ color: colors.textMuted }}>Cargando…</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-xs py-6" style={{ color: colors.textMuted }}>
            Sin registros hoy. Usa &quot;Simular foto&quot; o envía una foto al chat del paciente.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.divider }}>
            {logs.map((l, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">🍽️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{l.tiempo}</p>
                  <p className="text-xs mt-0.5 whitespace-pre-line" style={{ color: colors.textSecondary }}>
                    {l.geminiRaw.split('\n').filter((x) => x.trim().startsWith('-')).join('\n') || l.geminiRaw}
                  </p>
                </div>
                <span className="text-sm font-bold flex-shrink-0 tabular-nums" style={{ color: ACCENT }}>~{l.calorias_estimadas} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NutricionDashboardPage() {
  const { mediciones, logros } = useNutricion();
  const { colors, theme } = useNutricionTheme();
  const activos = pacientesActivos().length;
  const promMes = promedioPerdidaPesoMesKg(mediciones);
  const riesgo = pacientesActivosEnRiesgo(7);
  const logrosMes = logros.filter((l) => l.fecha.startsWith('2026-03')).length;
  const top5 = pacientesMasActivosParaDashboard(5, mediciones);
  const feedShow = [...logros].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
  const isLight = theme === 'light';

  const gridStroke = isLight ? '#e5e7eb' : '#ffffff18';
  const axisFill = isLight ? '#6b7280' : '#94a3b8';
  const tooltipStyle = { background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary };

  return (
    <>
      <section className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row items-center gap-10 px-2">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
            Demo en vivo · {BRAND_NUTRICION.centro}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: colors.textPrimary }}>
            {BRAND_NUTRICION.tagline}
            <br />
            <span style={{ color: AMBER }}>Progreso real, sin abandono</span>
          </h2>
          <p className="text-base max-w-md" style={{ color: colors.textSecondary }}>
            Acompañamiento y motivación: tableros, recordatorios y una IA que conoce el plan de cada paciente.
          </p>
        </div>
        <div className="flex-shrink-0">
          <PhoneMockup businessName="NutriVida" businessEmoji="💚" accentColor={ACCENT} apiRoute="/api/demo/nutricion/chat"
            initialMessage={'¡Hola! 💚 Soy tu asistente de NutriVida.\nPuedo ayudarte con tu dieta, sustituciones de alimentos\ny a mantenerte motivado/a. ¿En qué te ayudo hoy?'}
            suggestedChips={['⭐ Mis puntos de lealtad','🥗 ¿Puedo comer aguacate?','💪 ¿Cuánto he bajado?','🍕 Me antojó pizza, ¿qué hago?']}
            loyaltyCardData={DEMO_LOYALTY_NUTRI}
          />
        </div>
      </section>

      <div id="panel-admin" className="space-y-8 max-w-7xl mx-auto">
        {riesgo.length > 0 && (
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 6px rgba(239,68,68,0.15)', '0 0 0 0 rgba(239,68,68,0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-xl border border-red-300 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background: isLight ? '#fef2f2' : 'rgba(127,29,29,0.4)' }}
          >
            <span className="text-2xl">⚠️</span>
            <p className="text-sm flex-1" style={{ color: isLight ? '#991b1b' : '#fecaca' }}>
              <strong>{riesgo.length} paciente{riesgo.length === 1 ? '' : 's'}</strong> llevan más de 7 días sin registrar mediciones.
            </p>
            <Link href="/demo/nutricion/pacientes?filtro=riesgo" className="text-sm font-semibold underline decoration-red-400 whitespace-nowrap" style={{ color: isLight ? '#dc2626' : '#fca5a5' }}>
              Ver pacientes en riesgo →
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Pacientes activos', value: activos, color: '#16a34a', decimals: 0 as const },
            { label: 'Pérdida promedio este mes', value: promMes, color: AMBER, decimals: 1 as const, suffix: ' kg' },
            { label: 'En riesgo de abandono', value: riesgo.length, color: '#ef4444', decimals: 0 as const },
            { label: 'Logros este mes', value: logrosMes, color: '#84cc16', decimals: 0 as const, suffix: ' 🏆' },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl p-5"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{k.label}</p>
              <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: k.color }}>
                <AnimatedNumber value={k.value} decimals={'decimals' in k ? k.decimals : 0} suffix={'suffix' in k && k.suffix ? k.suffix : ''} />
              </p>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>Progreso de la semana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {top5.map((p) => {
              const spark = sparklinePeso4Semanas(p.id, mediciones);
              const data = spark.map((s) => ({ w: s.semana, peso: s.peso }));
              const v = variacionPesoUltimaSemana(p.id, mediciones);
              const ult = ultimaMedicion(p.id, mediciones);
              return (
                <div key={p.id} className="rounded-xl p-4"
                  style={{ border: `1px solid ${colors.border}`, background: colors.cardBg, boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
                  <p className="font-medium text-sm truncate" style={{ color: ACCENT }}>{p.nombre}</p>
                  <p className="text-[10px] mb-2" style={{ color: colors.textMuted }}>{p.objetivo}</p>
                  <div className="h-[72px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.length ? data : [{ w: '—', peso: ult?.peso ?? 0 }]}>
                        <Line type="monotone" dataKey="peso" stroke={ACCENT} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs mt-2">
                    {v < -0.05 ? <span className="text-emerald-500">↓ {Math.abs(v)}kg esta semana</span>
                      : v > 0.05 ? <span className="text-amber-500">↑ {v}kg esta semana</span>
                      : <span style={{ color: colors.textMuted }}>→ Sin cambios</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <PanelActividad pacientes={MOCK_PACIENTES} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>Logros recientes</h2>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {feedShow.map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-xl p-4 text-sm"
                  style={{
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(255,255,255,0.1)'}`,
                    background: isLight ? '#f0fdf4' : 'rgba(22,163,74,0.1)',
                    color: colors.textPrimary,
                  }}>
                  <span className="mr-2">{l.emoji}</span>{l.descripcion}
                  <span className="block text-[10px] mt-1" style={{ color: colors.textMuted }}>{l.fecha}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>Calendario de la semana (lun–vie)</h2>
            <div className="rounded-xl p-4 space-y-4 max-h-[320px] overflow-y-auto"
              style={{ border: `1px solid ${colors.border}`, background: colors.cardBg, boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
              {['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21'].map((d) => {
                const citas = MOCK_CITAS_SEMANA.filter((c) => c.fecha === d);
                const label = new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
                return (
                  <div key={d}>
                    <p className="text-xs font-semibold text-emerald-600 capitalize mb-2">{label}</p>
                    <ul className="space-y-1.5 text-xs">
                      {citas.map((c) => (
                        <li key={c.id} className="flex justify-between gap-2 rounded-lg px-2 py-1.5"
                          style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                          <span className="font-mono text-emerald-500">{c.hora}</span>
                          <span className="truncate" style={{ color: colors.textPrimary }}>{nombreCorto(c.pacienteId)}</span>
                          <span className="truncate" style={{ color: colors.textMuted }}>{c.motivo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>🛒 Lista del súper semanal</h2>
          <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
            Genera la lista de compras para 7 días basada en el plan de cada paciente y el SMAE.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {MOCK_PACIENTES.slice(0, 6).map((p) => (
              <FilaPacienteSuper key={p.id} pacienteId={p.id} />
            ))}
          </div>
        </div>

        <RegistroCalorico />

        <div className="rounded-xl p-4 h-[300px]"
          style={{ border: `1px solid ${colors.border}`, background: colors.cardBg, boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Progreso promedio del grupo (tendencia del consultorio)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <ComposedChart data={SERIE_PROGRESO_GRUPO}>
              <defs>
                <linearGradient id="nutriFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="semana" tick={{ fill: axisFill, fontSize: 11 }} />
              <YAxis tick={{ fill: axisFill, fontSize: 11 }} unit=" kg" />
              <Tooltip formatter={(v: number) => [`${v} kg`, 'Pérdida acum. prom.']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="kgPerdidaPromedio" stroke="none" fill="url(#nutriFill)" />
              <Line type="monotone" dataKey="kgPerdidaPromedio" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
