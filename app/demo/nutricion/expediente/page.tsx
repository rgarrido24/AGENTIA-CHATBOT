'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Save, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNutricionTheme } from '../nutricion-theme-context';

const ACCENT = '#16a34a';
const DEMO_PATIENT = 'ana-garcia';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Sexo = 'femenino' | 'masculino';

interface Medicion {
  fecha:       string;
  peso:        number;
  talla:       number;
  cintura:     number;
  cadera:      number;
  grasaCorp:   number;
  imc:         number;
  icc:         number;
  pesoIdeal:   number;
  adecuacion:  number;
}

interface Expediente {
  nombre:       string;
  edad:         string;
  sexo:         Sexo;
  fechaNac:     string;
  ocupacion:    string;
  telefono:     string;
  email:        string;
  motivacion:   string;
  objetivo:     string;
  diabetes:     boolean;
  hipertension: boolean;
  dislipidemia: boolean;
  otrosAnt:     string;
  mediciones:   Medicion[];
}

const EMPTY_EXP: Expediente = {
  nombre: '', edad: '', sexo: 'femenino', fechaNac: '', ocupacion: '', telefono: '', email: '',
  motivacion: '', objetivo: '',
  diabetes: false, hipertension: false, dislipidemia: false, otrosAnt: '',
  mediciones: [],
};

const DEMO_EXP: Expediente = {
  nombre: 'Ana García', edad: '34', sexo: 'femenino', fechaNac: '1991-06-15',
  ocupacion: 'Diseñadora gráfica', telefono: '5491155223344', email: 'ana.garcia@gmail.com',
  motivacion: 'Bajar de peso después del embarazo y mejorar energía.',
  objetivo: 'Llegar a 62 kg manteniendo masa muscular. Reducir grasa corporal al 25%.',
  diabetes: false, hipertension: false, dislipidemia: false, otrosAnt: '',
  mediciones: [
    { fecha: '2025-10-01', peso: 71.2, talla: 163, cintura: 82, cadera: 96, grasaCorp: 31.2, imc: 26.8, icc: 0.85, pesoIdeal: 59.8, adecuacion: 119 },
    { fecha: '2025-11-01', peso: 69.5, talla: 163, cintura: 80, cadera: 95, grasaCorp: 30.1, imc: 26.2, icc: 0.84, pesoIdeal: 59.8, adecuacion: 116 },
    { fecha: '2025-12-01', peso: 68.0, talla: 163, cintura: 78, cadera: 94, grasaCorp: 29.0, imc: 25.6, icc: 0.83, pesoIdeal: 59.8, adecuacion: 114 },
    { fecha: '2026-01-01', peso: 66.4, talla: 163, cintura: 76, cadera: 93, grasaCorp: 27.8, imc: 25.0, icc: 0.82, pesoIdeal: 59.8, adecuacion: 111 },
    { fecha: '2026-02-01', peso: 65.1, talla: 163, cintura: 74, cadera: 92, grasaCorp: 26.5, imc: 24.5, icc: 0.80, pesoIdeal: 59.8, adecuacion: 109 },
    { fecha: '2026-03-01', peso: 64.0, talla: 163, cintura: 72, cadera: 91, grasaCorp: 25.9, imc: 24.1, icc: 0.79, pesoIdeal: 59.8, adecuacion: 107 },
  ],
};

// ─── Cálculos ─────────────────────────────────────────────────────────────────

function calcIMC(peso: number, tallaCm: number) {
  const tallaM = tallaCm / 100;
  return peso / (tallaM * tallaM);
}

function imcLabel(imc: number) {
  if (imc < 18.5) return { label: 'Bajo peso', color: '#3b82f6' };
  if (imc < 25)   return { label: 'Normal',     color: ACCENT };
  if (imc < 30)   return { label: 'Sobrepeso',  color: '#f59e0b' };
  if (imc < 35)   return { label: 'Obesidad I', color: '#ef4444' };
  if (imc < 40)   return { label: 'Obesidad II', color: '#dc2626' };
  return                  { label: 'Obesidad III', color: '#991b1b' };
}

function iccRiesgo(icc: number, sexo: Sexo) {
  if (sexo === 'masculino') {
    if (icc < 0.90) return { label: 'Sin riesgo', color: ACCENT };
    if (icc < 0.95) return { label: 'Riesgo moderado', color: '#f59e0b' };
    return                 { label: 'Riesgo alto', color: '#ef4444' };
  } else {
    if (icc < 0.80) return { label: 'Sin riesgo', color: ACCENT };
    if (icc < 0.85) return { label: 'Riesgo moderado', color: '#f59e0b' };
    return                 { label: 'Riesgo alto', color: '#ef4444' };
  }
}

function calcPesoIdeal(tallaCm: number, sexo: Sexo) {
  if (sexo === 'masculino') return tallaCm - 100 - (tallaCm - 150) / 4;
  return tallaCm - 100 - (tallaCm - 150) / 2;
}

function adecuacion(peso: number, ideal: number) {
  return Math.round((peso / ideal) * 100);
}

function adecuacionLabel(pct: number) {
  if (pct < 90)  return { label: 'Bajo peso', color: '#3b82f6' };
  if (pct <= 110) return { label: 'Adecuado', color: ACCENT };
  if (pct <= 120) return { label: 'Sobrepeso', color: '#f59e0b' };
  return                 { label: 'Obesidad', color: '#ef4444' };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'datos' | 'medidas' | 'historial';

export default function ExpedientePage() {
  const { colors } = useNutricionTheme();
  const [tab, setTab]           = useState<Tab>('datos');
  const [exp, setExp]           = useState<Expediente>(DEMO_EXP);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // New measurement form
  const [peso,     setPeso]     = useState('');
  const [talla,    setTalla]    = useState('163');
  const [cintura,  setCintura]  = useState('');
  const [cadera,   setCadera]   = useState('');
  const [grasa,    setGrasa]    = useState('');
  const [addingM,  setAddingM]  = useState(false);

  useEffect(() => {
    fetch(`/api/demo/nutricion/expediente?patientId=${DEMO_PATIENT}`)
      .then((r) => r.json())
      .then((d) => { if (d.patient) setExp({ ...DEMO_EXP, ...d.patient }); })
      .catch(() => {});
  }, []);

  const saveExpediente = async () => {
    setSaving(true);
    try {
      const { mediciones: _m, ...fields } = exp;
      await fetch('/api/demo/nutricion/expediente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: DEMO_PATIENT, ...fields }),
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const addMedicion = async () => {
    if (!peso || !talla) return;
    const p = parseFloat(peso), t = parseFloat(talla), c = parseFloat(cintura) || 0, ca = parseFloat(cadera) || 0;
    const imc     = calcIMC(p, t);
    const ideal   = calcPesoIdeal(t, exp.sexo);
    const adec    = adecuacion(p, ideal);
    const icc     = ca > 0 ? Math.round((c / ca) * 100) / 100 : 0;
    const nueva: Medicion = {
      fecha: new Date().toISOString().slice(0, 10),
      peso: p, talla: t, cintura: c, cadera: ca, grasaCorp: parseFloat(grasa) || 0,
      imc: Math.round(imc * 10) / 10, icc, pesoIdeal: Math.round(ideal * 10) / 10, adecuacion: adec,
    };
    const updated = { ...exp, mediciones: [...exp.mediciones, nueva] };
    setExp(updated);
    setAddingM(false); setPeso(''); setCintura(''); setCadera(''); setGrasa('');
    await fetch('/api/demo/nutricion/expediente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: DEMO_PATIENT, action: 'add_medicion', medicion: nueva }),
    }).catch(() => {});
  };

  const ultima = exp.mediciones.at(-1);
  const imcInfo = ultima ? imcLabel(ultima.imc) : null;
  const iccInfo = ultima ? iccRiesgo(ultima.icc, exp.sexo) : null;
  const adInfo  = ultima ? adecuacionLabel(ultima.adecuacion) : null;

  const Field = ({ label, val, onChange, type = 'text', ph = '' }: {
    label: string; val: string; onChange: (v: string) => void; type?: string; ph?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{label}</label>
      <input type={type} value={val} onChange={(e) => onChange(e.target.value)} placeholder={ph}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
    </div>
  );

  const Check = ({ label, val, onChange }: { label: string; val: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!val)}
      className="flex items-center gap-2 text-sm font-medium"
      style={{ color: val ? ACCENT : colors.textSecondary }}>
      <span className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
        style={{ background: val ? ACCENT : colors.border }}>
        {val ? '✓' : ''}
      </span>
      {label}
    </button>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'datos', label: 'Datos generales' },
    { key: 'medidas', label: 'Medidas' },
    { key: 'historial', label: 'Historial' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: colors.accentSoft }}>
          <ClipboardList className="w-7 h-7" style={{ color: ACCENT }} />
        </div>
        <div>
          <h2 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Expediente del Paciente</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Ana García · Córdoba, Argentina</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: colors.cardBgAlt }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={tab === key
              ? { background: ACCENT, color: '#fff' }
              : { background: 'transparent', color: colors.textSecondary }
            }>{label}</button>
        ))}
      </div>

      {/* ── Datos generales ── */}
      {tab === 'datos' && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="Nombre completo" val={exp.nombre} onChange={(v) => setExp((p) => ({ ...p, nombre: v }))} ph="Ana García" /></div>
            <Field label="Edad" val={exp.edad} onChange={(v) => setExp((p) => ({ ...p, edad: v }))} type="number" ph="34" />
            <Field label="Fecha de nacimiento" val={exp.fechaNac} onChange={(v) => setExp((p) => ({ ...p, fechaNac: v }))} type="date" />
            <Field label="Ocupación" val={exp.ocupacion} onChange={(v) => setExp((p) => ({ ...p, ocupacion: v }))} ph="Diseñadora" />
            <Field label="Teléfono" val={exp.telefono} onChange={(v) => setExp((p) => ({ ...p, telefono: v }))} ph="549..." />
            <div className="col-span-2"><Field label="Email" val={exp.email} onChange={(v) => setExp((p) => ({ ...p, email: v }))} type="email" /></div>
          </div>

          {/* Sexo */}
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Sexo biológico</p>
            <div className="flex gap-3">
              {(['femenino', 'masculino'] as Sexo[]).map((s) => (
                <button key={s} onClick={() => setExp((p) => ({ ...p, sexo: s }))}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border"
                  style={exp.sexo === s
                    ? { background: ACCENT, color: '#fff', border: `1px solid ${ACCENT}` }
                    : { background: colors.inputBg, color: colors.textSecondary, border: `1px solid ${colors.border}` }
                  }>{s === 'femenino' ? '♀ Mujer' : '♂ Hombre'}</button>
              ))}
            </div>
          </div>

          {/* Antecedentes */}
          <div className="space-y-2">
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Antecedentes patológicos</p>
            <div className="grid grid-cols-3 gap-2">
              <Check label="Diabetes" val={exp.diabetes} onChange={(v) => setExp((p) => ({ ...p, diabetes: v }))} />
              <Check label="Hipertensión" val={exp.hipertension} onChange={(v) => setExp((p) => ({ ...p, hipertension: v }))} />
              <Check label="Dislipidemia" val={exp.dislipidemia} onChange={(v) => setExp((p) => ({ ...p, dislipidemia: v }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Otros antecedentes</label>
              <textarea value={exp.otrosAnt} onChange={(e) => setExp((p) => ({ ...p, otrosAnt: e.target.value }))}
                rows={2} placeholder="SOP, hipotiroidismo..."
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
            </div>
          </div>

          {/* Motivo / Objetivo */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Motivo de consulta</label>
            <textarea value={exp.motivacion} onChange={(e) => setExp((p) => ({ ...p, motivacion: e.target.value }))}
              rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Objetivo nutricional</label>
            <textarea value={exp.objetivo} onChange={(e) => setExp((p) => ({ ...p, objetivo: e.target.value }))}
              rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
          </div>

          <button onClick={saveExpediente} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ background: saved ? colors.accentSoft : ACCENT, color: saved ? ACCENT : '#fff' }}>
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar expediente'}
          </button>
        </div>
      )}

      {/* ── Medidas ── */}
      {tab === 'medidas' && (
        <div className="space-y-4">

          {/* Cálculos actuales */}
          {ultima && imcInfo && iccInfo && adInfo && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'IMC',                   value: ultima.imc.toFixed(1),     unit: 'kg/m²', color: imcInfo.color,  badge: imcInfo.label  },
                { title: 'ICC',                   value: ultima.icc.toFixed(2),     unit: '',      color: iccInfo.color,  badge: iccInfo.label  },
                { title: 'Peso ideal (Lorentz)',   value: ultima.pesoIdeal.toFixed(1), unit: 'kg', color: ACCENT,         badge: ''             },
                { title: '% Adecuación',           value: `${ultima.adecuacion}%`,  unit: '',      color: adInfo.color,   badge: adInfo.label   },
              ].map(({ title, value, unit, color, badge }) => (
                <div key={title} className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <p className="text-xs" style={{ color: colors.textMuted }}>{title}</p>
                  <p className="text-2xl font-extrabold mt-1" style={{ color }}>{value} <span className="text-sm font-normal" style={{ color: colors.textMuted }}>{unit}</span></p>
                  {badge && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${color}22`, color }}>{badge}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form nueva medición */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Registrar nueva medición</p>
              <button onClick={() => setAddingM((p) => !p)} className="text-xs px-3 py-1 rounded-lg font-medium"
                style={{ background: colors.accentSoft, color: ACCENT }}>
                <Plus className="w-3.5 h-3.5 inline mr-1" />{addingM ? 'Cancelar' : 'Agregar'}
              </button>
            </div>

            {addingM && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Peso (kg)', val: peso, set: setPeso, ph: 'ej. 64.5' },
                    { label: 'Talla (cm)', val: talla, set: setTalla, ph: 'ej. 163' },
                    { label: 'Cintura (cm)', val: cintura, set: setCintura, ph: 'ej. 74' },
                    { label: 'Cadera (cm)', val: cadera, set: setCadera, ph: 'ej. 92' },
                    { label: '% Grasa corporal', val: grasa, set: setGrasa, ph: 'ej. 27.5' },
                  ].map(({ label, val, set, ph }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{label}</label>
                      <input type="number" step="0.1" value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
                    </div>
                  ))}
                </div>
                {peso && talla && (() => {
                  const p = parseFloat(peso), t = parseFloat(talla);
                  if (!p || !t) return null;
                  const imc = calcIMC(p, t);
                  const ideal = calcPesoIdeal(t, exp.sexo);
                  const { label: imcL, color: imcC } = imcLabel(imc);
                  return (
                    <div className="flex gap-2 text-xs p-3 rounded-xl" style={{ background: colors.accentSoft }}>
                      <span style={{ color: ACCENT }}>IMC: <strong>{imc.toFixed(1)}</strong> ({imcL})</span>
                      <span style={{ color: colors.textMuted }}>·</span>
                      <span style={{ color: ACCENT }}>Peso ideal: <strong>{ideal.toFixed(1)} kg</strong></span>
                    </div>
                  );
                })()}
                <button onClick={addMedicion} disabled={!peso || !talla}
                  className="w-full py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: peso && talla ? ACCENT : colors.border, color: '#fff' }}>
                  Guardar medición
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Historial ── */}
      {tab === 'historial' && (
        <div className="space-y-4">

          {/* Chart */}
          {exp.mediciones.length >= 2 && (
            <div className="rounded-2xl p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" style={{ color: ACCENT }} />
                <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Evolución de peso</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={exp.mediciones.map((m) => ({ fecha: m.fecha.slice(5), peso: m.peso, imc: m.imc }))}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: colors.textMuted }} />
                  <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12 }}
                    labelStyle={{ color: colors.textPrimary, fontWeight: 600 }}
                    formatter={(v: number) => [`${v} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="peso" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="p-4 border-b" style={{ borderColor: colors.divider }}>
              <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Registro de mediciones</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.divider}` }}>
                    {['Fecha', 'Peso', 'IMC', '% Grasa', 'ICC', 'Adec.'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: colors.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...exp.mediciones].reverse().map((m, i) => {
                    const { color } = imcLabel(m.imc);
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${colors.divider}` }}>
                        <td className="px-3 py-2.5 font-medium" style={{ color: colors.textPrimary }}>{m.fecha}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: ACCENT }}>{m.peso} kg</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color }}>{m.imc}</td>
                        <td className="px-3 py-2.5" style={{ color: colors.textSecondary }}>{m.grasaCorp}%</td>
                        <td className="px-3 py-2.5" style={{ color: colors.textSecondary }}>{m.icc}</td>
                        <td className="px-3 py-2.5" style={{ color: colors.textSecondary }}>{m.adecuacion}%</td>
                      </tr>
                    );
                  })}
                  {exp.mediciones.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-sm" style={{ color: colors.textMuted }}>Sin mediciones registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
