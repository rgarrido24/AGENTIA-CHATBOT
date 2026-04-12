'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PACIENTES } from '@/lib/mock-data-nutricion';
import type { PlanSemanal, DiaPlan } from '@/app/api/demo/nutricion/plan-semanal/route';
import { useNutricionTheme } from '../nutricion-theme-context';

const ACCENT = '#16a34a';

const RESTRICCIONES_OPCIONES = [
  { id: 'sin-gluten',   label: 'Sin gluten' },
  { id: 'vegetariano',  label: 'Vegetariano' },
  { id: 'sin-lactosa',  label: 'Sin lactosa' },
  { id: 'sin-mariscos', label: 'Sin mariscos' },
  { id: 'diabetico',    label: 'Diabético' },
  { id: 'hipertenso',   label: 'Hipertenso' },
];

// ── Componente de un día ──────────────────────────────────────────────────────
function TarjetaDia({ dia, colors }: { dia: DiaPlan; colors: ReturnType<typeof useNutricionTheme>['colors'] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: `${ACCENT}18`, borderBottom: `1px solid ${colors.border}` }}
      >
        <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>{dia.dia}</h3>
        <span className="text-sm font-semibold" style={{ color: ACCENT }}>
          {dia.totalCalorias.toLocaleString()} kcal
        </span>
      </div>
      <div>
        {dia.tiempos.map((t, idx) => (
          <div
            key={t.nombre}
            className="grid grid-cols-[120px_1fr] gap-0"
            style={{ borderTop: idx > 0 ? `1px solid ${colors.divider}` : 'none' }}
          >
            <div
              className="flex items-start gap-2 px-4 py-3"
              style={{
                borderRight: `1px solid ${colors.divider}`,
                background: colors.cardBgAlt,
              }}
            >
              <span className="text-lg">{t.emoji}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{t.nombre}</p>
                <p className="text-[10px]" style={{ color: colors.textMuted }}>{t.calorias} kcal</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {t.equivalentes.map((eq, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold text-emerald-600">{eq.cantidad} eq</span>
                  <span className="mx-1" style={{ color: colors.textSecondary }}>{eq.grupo}</span>
                  {eq.ejemplos.length > 0 && (
                    <span style={{ color: colors.textMuted }}>
                      — {eq.ejemplos.slice(0, 2).join(' · ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PlanSemanalPage() {
  const { colors, theme } = useNutricionTheme();
  const isLight = theme === 'light';
  const [pacienteId, setPacienteId] = useState(MOCK_PACIENTES[0]!.id);
  const [calorias, setCalorias] = useState(1400);
  const [restricciones, setRestricciones] = useState<string[]>([]);
  const [preferencias, setPreferencias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<PlanSemanal | null>(null);
  const [diaActivo, setDiaActivo] = useState(0);

  const paciente = MOCK_PACIENTES.find(p => p.id === pacienteId) ?? MOCK_PACIENTES[0]!;

  function toggleRestriccion(id: string) {
    setRestricciones(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  }

  async function generar() {
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const res = await fetch('/api/demo/nutricion/plan-semanal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calorias,
          restricciones: restricciones.map(r => RESTRICCIONES_OPCIONES.find(o => o.id === r)?.label ?? r),
          preferencias,
          pacienteNombre: paciente.nombre,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `Error ${res.status}`);
      setPlan(json.plan as PlanSemanal);
      setDiaActivo(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar el plan');
    } finally {
      setLoading(false);
    }
  }

  function copiarPlan() {
    if (!plan) return;
    const lines: string[] = [`PLAN SEMANAL — ${paciente.nombre} — ${calorias} kcal/día\n`];
    for (const dia of plan.dias) {
      lines.push(`═══ ${dia.dia.toUpperCase()} (${dia.totalCalorias} kcal) ═══`);
      for (const t of dia.tiempos) {
        lines.push(`\n${t.emoji} ${t.nombre} (${t.calorias} kcal):`);
        for (const eq of t.equivalentes) {
          lines.push(`  • ${eq.cantidad} eq ${eq.grupo} — ${eq.ejemplos.join(' / ')}`);
        }
      }
      lines.push('');
    }
    lines.push(`\nDistribución: Proteína ${plan.distribucionMacros.proteina}% | Grasa ${plan.distribucionMacros.grasa}% | CHO ${plan.distribucionMacros.carbohidratos}%`);
    void navigator.clipboard.writeText(lines.join('\n'));
  }

  const inputStyle = {
    background: colors.inputBg,
    border: `1px solid ${colors.border}`,
    color: colors.textPrimary,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>🗓️ Generador de Plan Semanal con IA</h1>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Genera un plan de 7 días basado en equivalentes del SMAE adaptado a cada paciente
        </p>
      </div>

      {/* Formulario */}
      <div
        className="rounded-xl p-5 space-y-5"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        {/* Paciente */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>
            Paciente
          </label>
          <select
            value={pacienteId}
            onChange={e => setPacienteId(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inputStyle}
          >
            {MOCK_PACIENTES.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} — {p.objetivo}</option>
            ))}
          </select>
        </div>

        {/* Calorías */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>
            Calorías objetivo: <span style={{ color: ACCENT }} className="text-sm font-bold">{calorias.toLocaleString()} kcal/día</span>
          </label>
          <input
            type="range"
            min={1000}
            max={3000}
            step={100}
            value={calorias}
            onChange={e => setCalorias(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
            <span>1,000</span><span>2,000</span><span>3,000</span>
          </div>
        </div>

        {/* Restricciones */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: colors.textMuted }}>
            Restricciones alimentarias
          </label>
          <div className="flex flex-wrap gap-2">
            {RESTRICCIONES_OPCIONES.map(r => {
              const active = restricciones.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRestriccion(r.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors"
                  style={active
                    ? { background: ACCENT, borderColor: ACCENT, color: '#fff' }
                    : { background: 'transparent', borderColor: colors.border, color: colors.textSecondary }
                  }
                >
                  {active ? '✓ ' : ''}{r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferencias */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>
            Preferencias del paciente
          </label>
          <textarea
            value={preferencias}
            onChange={e => setPreferencias(e.target.value)}
            placeholder='Ej: "No le gustan las espinacas, prefiere pollo a res, come mucho de noche"'
            rows={2}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
            style={{ ...inputStyle, opacity: 1 }}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={generar}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          style={{ background: loading ? (isLight ? '#94a3b8' : '#334155') : ACCENT }}
        >
          {loading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Generando plan semanal…
            </>
          ) : '✨ Generar Plan Semanal'}
        </button>
      </div>

      {/* Resultado */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Resumen */}
            <div
              className="flex flex-wrap items-center gap-3 px-5 py-3 rounded-xl"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
            >
              <p className="text-sm font-semibold flex-1" style={{ color: colors.textPrimary }}>
                Plan para <span style={{ color: ACCENT }}>{paciente.nombre}</span>
                {' '}— promedio {plan.caloriasPromedio.toLocaleString()} kcal/día
              </p>
              <div className="flex gap-2 text-xs">
                <span
                  className="px-2 py-1 rounded-full border"
                  style={{ background: isLight ? '#ede9fe' : 'rgba(109,40,217,0.2)', color: isLight ? '#7c3aed' : '#c4b5fd', borderColor: isLight ? '#ddd6fe' : '#6d28d9' }}
                >P: {plan.distribucionMacros.proteina}%</span>
                <span
                  className="px-2 py-1 rounded-full border"
                  style={{ background: isLight ? '#fef3c7' : 'rgba(120,53,15,0.5)', color: isLight ? '#b45309' : '#fcd34d', borderColor: isLight ? '#fde68a' : '#78350f' }}
                >G: {plan.distribucionMacros.grasa}%</span>
                <span
                  className="px-2 py-1 rounded-full border"
                  style={{ background: isLight ? '#dcfce7' : 'rgba(6,78,59,0.4)', color: isLight ? '#15803d' : '#6ee7b7', borderColor: isLight ? '#bbf7d0' : '#064e3b' }}
                >CHO: {plan.distribucionMacros.carbohidratos}%</span>
              </div>
            </div>

            {/* Tabs de días */}
            <div className="overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex gap-1.5 min-w-max">
                {plan.dias.map((dia, i) => (
                  <button
                    key={dia.dia}
                    onClick={() => setDiaActivo(i)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                    style={
                      i === diaActivo
                        ? { background: ACCENT, color: '#fff' }
                        : { background: colors.cardBgAlt, color: colors.textSecondary }
                    }
                  >
                    {dia.dia}
                    <span className="text-[10px] opacity-60 ml-1">
                      {dia.totalCalorias.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta del día activo */}
            {plan.dias[diaActivo] && <TarjetaDia dia={plan.dias[diaActivo]!} colors={colors} />}

            {/* Acciones */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copiarPlan}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
              >
                📋 Copiar plan completo
              </button>
              <button
                onClick={generar}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
              >
                🔄 Regenerar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
