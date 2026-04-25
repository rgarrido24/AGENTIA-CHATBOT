'use client';

import { useState } from 'react';
import { Heart, Save } from 'lucide-react';
import { useNutricionTheme } from '../nutricion-theme-context';

const ACCENT = '#16a34a';
const DEMO_PATIENT = 'ana-garcia';

type Sexo = 'hombre' | 'mujer';
type Clasificacion = 'bajo' | 'moderado' | 'alto';

// ─── Framingham 1998 (Wilson et al.) ────────────────────────────────────────

function framingham(params: {
  edad: number; sexo: Sexo; tc: number; hdl: number;
  sbp: number; tratado: boolean; fumador: boolean;
}): number {
  const { edad, sexo, tc, hdl, sbp, tratado, fumador } = params;
  const ln = Math.log;
  if (sexo === 'hombre') {
    const sum =
      3.06117 * ln(edad) +
      1.12370 * ln(tc) -
      0.93263 * ln(hdl) +
      (tratado ? 1.93303 : 1.99881) * ln(sbp) +
      0.65451 * (fumador ? 1 : 0) -
      23.9802;
    return (1 - Math.pow(0.88936, Math.exp(sum))) * 100;
  } else {
    const sum =
      2.32888 * ln(edad) +
      1.20904 * ln(tc) -
      0.70833 * ln(hdl) +
      (tratado ? 2.76157 : 2.82263) * ln(sbp) +
      0.52873 * (fumador ? 1 : 0) -
      26.1931;
    return (1 - Math.pow(0.95012, Math.exp(sum))) * 100;
  }
}

// ─── Average risk lookup (Framingham reference tables) ────────────────────

const AVG_HOMBRE: Record<number, number> = {
  30: 1, 35: 4, 40: 5, 45: 7, 50: 11, 55: 14, 60: 16, 65: 21,
};
const AVG_MUJER: Record<number, number> = {
  30: 1, 35: 1, 40: 2, 45: 4, 50: 6, 55: 8, 60: 11, 65: 13,
};

function avgRisk(edad: number, sexo: Sexo): number {
  const table = sexo === 'hombre' ? AVG_HOMBRE : AVG_MUJER;
  const bracket = Math.floor(edad / 5) * 5;
  const clamped = Math.max(30, Math.min(65, bracket));
  return table[clamped] ?? 5;
}

function clasificar(riesgo: number): Clasificacion {
  if (riesgo < 10) return 'bajo';
  if (riesgo <= 20) return 'moderado';
  return 'alto';
}

const CLAS_LABEL: Record<Clasificacion, string>  = { bajo: 'Bajo',    moderado: 'Moderado',   alto: 'Alto'    };
const CLAS_COLOR: Record<Clasificacion, string>  = { bajo: '#16a34a', moderado: '#f59e0b',     alto: '#ef4444' };
const CLAS_BG:    Record<Clasificacion, string>  = { bajo: '#f0fdf4', moderado: '#fffbeb',      alto: '#fef2f2' };

// ─── Gauge SVG ──────────────────────────────────────────────────────────────

function Gauge({ pct, color }: { pct: number; color: string }) {
  const r = 54;
  const circ = Math.PI * r; // semicircle circumference
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg viewBox="0 0 120 70" className="w-full max-w-[220px]">
      {/* Track */}
      <path
        d={`M 10 60 A ${r} ${r} 0 0 1 110 60`}
        fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M 10 60 A ${r} ${r} 0 0 1 110 60`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {/* Center text */}
      <text x="60" y="55" textAnchor="middle" className="font-extrabold" fontSize="18" fontWeight="800" fill={color}>
        {pct.toFixed(1)}%
      </text>
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CardiovascularPage() {
  const { colors } = useNutricionTheme();
  const [edad,     setEdad]     = useState('');
  const [sexo,     setSexo]     = useState<Sexo>('mujer');
  const [tc,       setTc]       = useState('');
  const [hdl,      setHdl]      = useState('');
  const [sbp,      setSbp]      = useState('');
  const [tratado,  setTratado]  = useState(false);
  const [fumador,  setFumador]  = useState(false);
  const [result,   setResult]   = useState<{ riesgo: number; clas: Clasificacion; avg: number } | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const allFilled = edad && tc && hdl && sbp;

  const calculate = () => {
    const e = parseFloat(edad), t = parseFloat(tc), h = parseFloat(hdl), s = parseFloat(sbp);
    if (!e || !t || !h || !s) return;
    const riesgo = Math.max(0, framingham({ edad: e, sexo, tc: t, hdl: h, sbp: s, tratado, fumador }));
    setResult({ riesgo, clas: clasificar(riesgo), avg: avgRisk(e, sexo) });
    setSaved(false);
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await fetch('/api/demo/nutricion/cardiovascular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: DEMO_PATIENT, edad: parseFloat(edad), sexo, colesterolTotal: parseFloat(tc),
          hdl: parseFloat(hdl), presionSistolica: parseFloat(sbp), enTratamiento: tratado,
          fumador, riesgo10a: result.riesgo, clasificacion: result.clas, promedioEdad: result.avg,
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const loadDemo = () => {
    setEdad('45'); setSexo('mujer'); setTc('220'); setHdl('48'); setSbp('128');
    setTratado(false); setFumador(false); setResult(null); setSaved(false);
  };

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium"
      style={{ background: value ? '#f0fdf4' : colors.inputBg, border: `1px solid ${value ? ACCENT + '55' : colors.border}`, color: colors.textPrimary }}
    >
      {label}
      <span className="w-10 h-6 rounded-full flex items-center transition-colors px-0.5"
        style={{ background: value ? ACCENT : colors.border, justifyContent: value ? 'flex-end' : 'flex-start' }}>
        <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
      </span>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
          <Heart className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h2 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Riesgo Cardiovascular</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Escala de Framingham — Wilson et al. 1998 · Riesgo a 10 años</p>
        </div>
        <button onClick={loadDemo} className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
          style={{ background: colors.accentSoft, color: ACCENT }}>Cargar demo</button>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>

        {/* Sexo */}
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Sexo biológico</p>
          <div className="flex gap-3">
            {(['hombre', 'mujer'] as Sexo[]).map((s) => (
              <button key={s} onClick={() => setSexo(s)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold border capitalize"
                style={sexo === s
                  ? { background: ACCENT, color: '#fff', border: `1px solid ${ACCENT}` }
                  : { background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.border}` }
                }>{s === 'hombre' ? '♂ Hombre' : '♀ Mujer'}</button>
            ))}
          </div>
        </div>

        {/* Numeric inputs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Edad', val: edad, set: setEdad, unit: 'años', ph: 'ej. 45' },
            { label: 'Colesterol total', val: tc, set: setTc, unit: 'mg/dL', ph: 'ej. 200' },
            { label: 'HDL', val: hdl, set: setHdl, unit: 'mg/dL', ph: 'ej. 55' },
            { label: 'Presión sistólica', val: sbp, set: setSbp, unit: 'mmHg', ph: 'ej. 120' },
          ].map(({ label, val, set, unit, ph }) => (
            <div key={label}>
              <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{label}</label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                <input type="number" min={0} value={val} onChange={(e) => { set(e.target.value); setResult(null); }}
                  placeholder={ph}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                  style={{ color: colors.textPrimary, background: colors.inputBg }} />
                <span className="px-2 text-xs font-medium shrink-0" style={{ color: colors.textMuted, background: colors.cardBgAlt }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Toggles */}
        <Toggle value={tratado} onChange={(v) => { setTratado(v); setResult(null); }} label="¿En tratamiento para hipertensión?" />
        <Toggle value={fumador} onChange={(v) => { setFumador(v); setResult(null); }} label="¿Fumador activo?" />

        <button onClick={calculate} disabled={!allFilled}
          className="w-full py-3 rounded-xl text-sm font-bold"
          style={{ background: allFilled ? '#ef4444' : colors.border, color: '#fff', opacity: allFilled ? 1 : 0.5 }}>
          ❤️ Calcular riesgo cardiovascular
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 text-center" style={{ background: colors.cardBg, border: `2px solid ${CLAS_COLOR[result.clas]}44` }}>
            <p className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>Riesgo cardiovascular a 10 años</p>

            <div className="flex justify-center mb-3">
              <Gauge pct={result.riesgo} color={CLAS_COLOR[result.clas]} />
            </div>

            <span className="inline-block text-lg font-extrabold px-6 py-2 rounded-full"
              style={{ background: CLAS_BG[result.clas], color: CLAS_COLOR[result.clas] }}>
              Riesgo {CLAS_LABEL[result.clas]}
            </span>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl p-3" style={{ background: colors.cardBgAlt }}>
                <p className="text-xs" style={{ color: colors.textMuted }}>Tu riesgo estimado</p>
                <p className="text-2xl font-extrabold" style={{ color: CLAS_COLOR[result.clas] }}>{result.riesgo.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: colors.cardBgAlt }}>
                <p className="text-xs" style={{ color: colors.textMuted }}>Promedio para tu edad/sexo</p>
                <p className="text-2xl font-extrabold" style={{ color: colors.textSecondary }}>{result.avg}%</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-left p-3 rounded-xl" style={{ background: CLAS_BG[result.clas], color: CLAS_COLOR[result.clas] }}>
              {result.clas === 'bajo' && '✅ Riesgo cardiovascular bajo. Mantén hábitos saludables, actividad física y dieta equilibrada.'}
              {result.clas === 'moderado' && '⚠️ Riesgo moderado. Se recomienda modificar factores de riesgo con cambios en alimentación, ejercicio y si aplica, medicación.'}
              {result.clas === 'alto' && '🔴 Riesgo alto. Requiere atención médica. Evaluar tratamiento farmacológico además de cambios intensivos en estilo de vida.'}
            </p>
          </div>

          <button onClick={save} disabled={saving || saved}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
            style={{ background: saved ? colors.accentSoft : ACCENT, color: saved ? ACCENT : '#fff' }}>
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : saved ? '✓ Guardado en MongoDB' : 'Guardar resultado'}
          </button>
        </div>
      )}
    </div>
  );
}
