'use client';

import { useState } from 'react';
import { FlaskConical, RotateCcw, Save } from 'lucide-react';
import { useNutricionTheme } from '../nutricion-theme-context';

const ACCENT = '#16a34a';
const DEMO_PATIENT = 'ana-garcia';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Semaforo = 'verde' | 'amarillo' | 'rojo';
type Sexo = 'masculino' | 'femenino';

interface LabValues {
  glucosa:       string;
  colesterol:    string;
  trigliceridos: string;
  hdl:           string;
  ldl:           string;
  acidoUrico:    string;
}

interface LabResult {
  valor:         number;
  semaforo:      Semaforo;
  rango:         string;
  recomendacion: string;
}

// ─── Semáforo logic ───────────────────────────────────────────────────────────

function calcGlucosa(v: number): LabResult {
  const s: Semaforo = v >= 70 && v <= 100 ? 'verde' : v <= 125 ? 'amarillo' : 'rojo';
  return {
    valor: v, semaforo: s,
    rango: '70 – 100 mg/dL',
    recomendacion: s === 'verde' ? 'Glucosa en ayuno normal.' :
      s === 'amarillo' ? 'Glucosa en límite. Reducir carbohidratos simples y aumentar fibra.' :
        'Glucosa elevada. Evaluar tolerancia a la glucosa; posible prediabetes/diabetes.',
  };
}

function calcColesterol(v: number): LabResult {
  const s: Semaforo = v < 200 ? 'verde' : v <= 239 ? 'amarillo' : 'rojo';
  return {
    valor: v, semaforo: s,
    rango: '< 200 mg/dL',
    recomendacion: s === 'verde' ? 'Colesterol total óptimo.' :
      s === 'amarillo' ? 'Colesterol en límite. Reducir grasas saturadas y trans.' :
        'Colesterol elevado. Dieta hipolipídica y valorar tratamiento médico.',
  };
}

function calcTrigliceridos(v: number): LabResult {
  const s: Semaforo = v < 150 ? 'verde' : v <= 199 ? 'amarillo' : 'rojo';
  return {
    valor: v, semaforo: s,
    rango: '< 150 mg/dL',
    recomendacion: s === 'verde' ? 'Triglicéridos normales.' :
      s === 'amarillo' ? 'Triglicéridos en límite. Reducir azúcares y alcohol.' :
        'Triglicéridos elevados. Eliminar azúcares refinados; omega-3 puede ayudar.',
  };
}

function calcHdl(v: number, sexo: Sexo): LabResult {
  const umbral = sexo === 'masculino' ? 40 : 50;
  const s: Semaforo = v >= umbral ? 'verde' : v >= umbral - 5 ? 'amarillo' : 'rojo';
  return {
    valor: v, semaforo: s,
    rango: sexo === 'masculino' ? '> 40 mg/dL' : '> 50 mg/dL',
    recomendacion: s === 'verde' ? 'HDL protector cardiovascular adecuado.' :
      s === 'amarillo' ? 'HDL en límite. Aumentar actividad física y consumo de grasas buenas.' :
        'HDL bajo. Riesgo cardiovascular aumentado. Ejercicio aeróbico y omega-3.',
  };
}

function calcLdl(v: number): LabResult {
  const s: Semaforo = v < 100 ? 'verde' : v <= 129 ? 'amarillo' : 'rojo';
  return {
    valor: v, semaforo: s,
    rango: '< 100 mg/dL',
    recomendacion: s === 'verde' ? 'LDL óptimo.' :
      s === 'amarillo' ? 'LDL cercano al límite. Dieta mediterránea y fibra soluble.' :
        'LDL elevado. Dieta baja en grasas saturadas; valorar estatinas con médico.',
  };
}

function calcAcidoUrico(v: number, sexo: Sexo): LabResult {
  const [lo, hi] = sexo === 'masculino' ? [3.5, 7.2] : [2.6, 6.0];
  const s: Semaforo = v >= lo && v <= hi ? 'verde' :
    (v > hi && v <= hi * 1.1) || (v < lo && v >= lo * 0.9) ? 'amarillo' : 'rojo';
  return {
    valor: v, semaforo: s,
    rango: sexo === 'masculino' ? '3.5 – 7.2 mg/dL' : '2.6 – 6.0 mg/dL',
    recomendacion: s === 'verde' ? 'Ácido úrico en rango normal.' :
      v > hi ? 'Ácido úrico elevado (hiperuricemia). Reducir purinas: carnes rojas, mariscos, alcohol.' :
        'Ácido úrico bajo. Puede indicar problema renal o hepático.',
  };
}

function calcularSemaforos(vals: LabValues, sexo: Sexo): Record<string, LabResult> | null {
  const toNum = (s: string) => parseFloat(s);
  if (!vals.glucosa || !vals.colesterol || !vals.trigliceridos || !vals.hdl || !vals.ldl || !vals.acidoUrico) return null;
  return {
    glucosa:       calcGlucosa(toNum(vals.glucosa)),
    colesterol:    calcColesterol(toNum(vals.colesterol)),
    trigliceridos: calcTrigliceridos(toNum(vals.trigliceridos)),
    hdl:           calcHdl(toNum(vals.hdl), sexo),
    ldl:           calcLdl(toNum(vals.ldl)),
    acidoUrico:    calcAcidoUrico(toNum(vals.acidoUrico), sexo),
  };
}

function resumenPerfil(res: Record<string, LabResult>): string {
  const rojos   = Object.values(res).filter((r) => r.semaforo === 'rojo').length;
  const amarillos = Object.values(res).filter((r) => r.semaforo === 'amarillo').length;
  if (rojos === 0 && amarillos === 0) return '✅ Perfil metabólico excelente. Todos los marcadores dentro del rango óptimo.';
  if (rojos >= 3) return '🔴 Perfil metabólico de alto riesgo. Requiere atención médica y cambios alimentarios urgentes.';
  if (rojos >= 1) return `⚠️ Perfil metabólico alterado: ${rojos} marcador${rojos > 1 ? 'es' : ''} fuera de rango. Ajuste nutricional recomendado.`;
  return `🟡 Perfil metabólico en límite: ${amarillos} marcador${amarillos > 1 ? 'es' : ''} en zona de precaución. Cambios preventivos recomendados.`;
}

// ─── Semáforo display ────────────────────────────────────────────────────────

const SEMAFORO_COLOR = { verde: '#16a34a', amarillo: '#f59e0b', rojo: '#ef4444' };
const SEMAFORO_BG    = { verde: '#f0fdf4', amarillo: '#fffbeb', rojo: '#fef2f2' };
const SEMAFORO_LABEL = { verde: 'Normal', amarillo: 'Límite', rojo: 'Alterado' };
const SEMAFORO_EMOJI = { verde: '🟢', amarillo: '🟡', rojo: '🔴' };

const FIELD_LABELS: Record<string, string> = {
  glucosa: 'Glucosa en ayuno',
  colesterol: 'Colesterol total',
  trigliceridos: 'Triglicéridos',
  hdl: 'HDL (colesterol bueno)',
  ldl: 'LDL (colesterol malo)',
  acidoUrico: 'Ácido úrico',
};

// ─── Page ────────────────────────────────────────────────────────────────────

const EMPTY: LabValues = { glucosa: '', colesterol: '', trigliceridos: '', hdl: '', ldl: '', acidoUrico: '' };
const DEMO_VALUES: LabValues = { glucosa: '97', colesterol: '215', trigliceridos: '168', hdl: '44', ldl: '128', acidoUrico: '6.5' };

export default function LaboratorioPage() {
  const { colors } = useNutricionTheme();
  const [sexo, setSexo]         = useState<Sexo>('femenino');
  const [vals, setVals]         = useState<LabValues>(EMPTY);
  const [results, setResults]   = useState<Record<string, LabResult> | null>(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const setVal = (k: keyof LabValues, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const analyze = () => {
    const r = calcularSemaforos(vals, sexo);
    setResults(r);
    setSaved(false);
  };

  const loadDemo = () => { setVals(DEMO_VALUES); setResults(null); setSaved(false); };
  const reset    = () => { setVals(EMPTY); setResults(null); setSaved(false); };

  const save = async () => {
    if (!results) return;
    setSaving(true);
    try {
      await fetch('/api/demo/nutricion/laboratorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: DEMO_PATIENT,
          sexo,
          valores: vals,
          semaforos: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.semaforo])),
          resumen: resumenPerfil(results),
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const inputs: { key: keyof LabValues; label: string; unit: string; placeholder: string }[] = [
    { key: 'glucosa',       label: 'Glucosa en ayuno',    unit: 'mg/dL', placeholder: 'ej. 95' },
    { key: 'colesterol',    label: 'Colesterol total',    unit: 'mg/dL', placeholder: 'ej. 190' },
    { key: 'trigliceridos', label: 'Triglicéridos',       unit: 'mg/dL', placeholder: 'ej. 140' },
    { key: 'hdl',           label: 'HDL',                 unit: 'mg/dL', placeholder: 'ej. 55' },
    { key: 'ldl',           label: 'LDL',                 unit: 'mg/dL', placeholder: 'ej. 95' },
    { key: 'acidoUrico',    label: 'Ácido úrico',         unit: 'mg/dL', placeholder: 'ej. 5.2' },
  ];

  const allFilled = inputs.every((i) => vals[i.key].trim() !== '');

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f0fdf4' }}>
          <FlaskConical className="w-7 h-7" style={{ color: ACCENT }} />
        </div>
        <div>
          <h2 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Análisis de Laboratorio</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Paciente demo: Ana García · Ingresa los valores de laboratorio</p>
        </div>
        <button
          onClick={loadDemo}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
          style={{ background: colors.accentSoft, color: ACCENT }}
        >
          Cargar demo
        </button>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-5 space-y-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>

        {/* Sexo */}
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Sexo biológico</p>
          <div className="flex gap-3">
            {(['masculino', 'femenino'] as Sexo[]).map((s) => (
              <button
                key={s}
                onClick={() => setSexo(s)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize"
                style={sexo === s
                  ? { background: ACCENT, color: '#fff', border: `1px solid ${ACCENT}` }
                  : { background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.border}` }
                }
              >
                {s === 'masculino' ? '♂ Hombre' : '♀ Mujer'}
              </button>
            ))}
          </div>
        </div>

        {/* Lab values grid */}
        <div className="grid grid-cols-2 gap-3">
          {inputs.map(({ key, label, unit, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{label}</label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={vals[key]}
                  onChange={(e) => setVal(key, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                  style={{ color: colors.textPrimary, background: colors.inputBg }}
                />
                <span className="px-2 text-xs font-medium shrink-0" style={{ color: colors.textMuted, background: colors.cardBgAlt }}>
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
          <button
            onClick={analyze}
            disabled={!allFilled}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity"
            style={{ background: allFilled ? ACCENT : colors.border, color: '#fff', opacity: allFilled ? 1 : 0.5 }}
          >
            🔬 Analizar resultados
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">

          {/* Summary */}
          <div
            className="rounded-2xl p-4 text-sm font-medium"
            style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          >
            <p className="font-bold mb-1" style={{ color: colors.textPrimary }}>Resumen del perfil metabólico</p>
            <p style={{ color: colors.textSecondary }}>{resumenPerfil(results)}</p>
          </div>

          {/* Semáforo cards */}
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(results).map(([key, res]) => {
              const color = SEMAFORO_COLOR[res.semaforo];
              const bg    = SEMAFORO_BG[res.semaforo];
              return (
                <div
                  key={key}
                  className="rounded-2xl p-4"
                  style={{ background: colors.cardBg, border: `2px solid ${color}33` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-base" style={{ color: colors.textPrimary }}>{FIELD_LABELS[key]}</p>
                      <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Referencia: {res.rango}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-3xl font-extrabold tabular-nums leading-none" style={{ color }}>
                        {res.valor}
                        <span className="text-base font-medium ml-1" style={{ color: colors.textMuted }}>mg/dL</span>
                      </p>
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: bg, color }}
                      >
                        {SEMAFORO_EMOJI[res.semaforo]} {SEMAFORO_LABEL[res.semaforo]}
                      </span>
                    </div>
                  </div>
                  <div
                    className="rounded-xl px-3 py-2 text-xs"
                    style={{ background: bg, color }}
                  >
                    {res.recomendacion}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <button
            onClick={save}
            disabled={saving || saved}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
            style={{ background: saved ? colors.accentSoft : ACCENT, color: saved ? ACCENT : '#fff' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : saved ? '✓ Guardado en MongoDB' : 'Guardar resultados'}
          </button>
        </div>
      )}
    </div>
  );
}
