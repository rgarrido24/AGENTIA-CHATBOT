'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, FileDown, MessageCircle, Pill } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { generarExpedientePdfMedico } from '@/lib/medico-pdf';
import {
  MEDICOS,
  HOY_MED,
  consultasDePaciente,
  type Consulta,
  type EspecialidadDemo,
  type MedicamentoReceta,
  type SignosVitales,
} from '@/lib/mock-data-medico';
import { useMedico } from '../medico-context';
import EcgSvg from '../components/EcgSvg';

const ACCENT = '#16a34a';

type TabEsp = EspecialidadDemo;

const TAB_LABEL: Record<TabEsp, string> = {
  general: 'General',
  ginecologia: 'Ginecología',
  cardiologia: 'Cardiología',
  pediatria: 'Pediatría',
};

function flagLabel(v: boolean) {
  return v ? 'Sí' : 'No';
}

function VitalsTable({ sv }: { sv: SignosVitales }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-[10px] border border-white/10 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-white/[0.05] text-slate-400">
            <th className="p-1.5 text-left">Peso</th>
            <th className="p-1.5 text-left">Talla</th>
            <th className="p-1.5 text-left">IMC</th>
            <th className="p-1.5 text-left">PA</th>
            <th className="p-1.5 text-left">FC</th>
            <th className="p-1.5 text-left">Temp</th>
            <th className="p-1.5 text-left">SpO₂</th>
            <th className="p-1.5 text-left">Glucosa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-1.5">{sv.pesoKg} kg</td>
            <td className="p-1.5">{sv.tallaCm} cm</td>
            <td className="p-1.5">{sv.imc}</td>
            <td className="p-1.5">{sv.presion}</td>
            <td className="p-1.5">{sv.fc} lpm</td>
            <td className="p-1.5">{sv.temperatura.toFixed(1)} °C</td>
            <td className="p-1.5">{sv.spo2}%</td>
            <td className="p-1.5">{sv.glucosaMgDl ?? '—'} mg/dL</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function buildSignos(partial: {
  pesoKg: number;
  tallaCm: number;
  presionSistolica: number;
  presionDiastolica: number;
  fc: number;
  temperatura: number;
  spo2: number;
  glucosaMgDl?: number;
}): SignosVitales {
  const imc = Math.round((partial.pesoKg / (partial.tallaCm / 100) ** 2) * 10) / 10;
  return {
    ...partial,
    imc,
    presion: `${partial.presionSistolica}/${partial.presionDiastolica}`,
  };
}

function ExpedienteInner() {
  const sp = useSearchParams();
  const { pacientes, consultas, addConsulta } = useMedico();
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [openNueva, setOpenNueva] = useState(false);
  const [expId, setExpId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tabEsp, setTabEsp] = useState<TabEsp>('general');
  const [metric, setMetric] = useState<'peso' | 'presion' | 'glucosa'>('peso');

  useEffect(() => {
    const id = sp.get('paciente');
    if (id) setSelId(id);
  }, [sp]);

  useEffect(() => {
    const p = selId ? pacientes.find((x) => x.id === selId) : undefined;
    if (p) setTabEsp(p.especialidad);
  }, [selId, pacientes]);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return pacientes.slice(0, 12);
    return pacientes.filter((x) => x.nombre.toLowerCase().includes(qq) || x.folio.toLowerCase().includes(qq));
  }, [q, pacientes]);

  const p = selId ? pacientes.find((x) => x.id === selId) : undefined;
  const hist = selId ? consultasDePaciente(consultas, selId) : [];

  const chartRows = useMemo(() => {
    const asc = [...hist].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const last = asc.slice(-5);
    return last.map((c) => ({
      fecha: c.fecha.slice(5),
      peso: c.signosVitales.pesoKg,
      presion: c.signosVitales.presionSistolica,
      glucosa: c.signosVitales.glucosaMgDl ?? 0,
    }));
  }, [hist]);

  const growthPed = useMemo(() => {
    const asc = [...hist].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-6);
    return asc.map((c, i) => ({
      fecha: c.fecha.slice(5),
      peso: c.signosVitales.pesoKg,
      talla: c.signosVitales.tallaCm,
      p50: 20 + i * 0.8,
      p75: 22 + i * 0.9,
    }));
  }, [hist]);

  const [form, setForm] = useState({
    medico: MEDICOS[0]!.nombre,
    motivo: '',
    diagnostico: '',
    tratamientoRealizado: '',
    tratamientoPendiente: '',
    notasEvolucion: '',
    proximaCita: '',
    costo: 0,
    pagado: 0,
    pesoKg: 70,
    tallaCm: 165,
    pas: 120,
    pad: 80,
    fc: 72,
    temp: 36.5,
    spo2: 98,
    glucosa: 95,
  });
  const [meds, setMeds] = useState<MedicamentoReceta[]>([{ nombre: '', dosis: '', frecuencia: '', dias: 0 }]);

  const guardarConsulta = () => {
    if (!p) return;
    const saldo = Math.max(0, form.costo - form.pagado);
    const sv = buildSignos({
      pesoKg: form.pesoKg,
      tallaCm: form.tallaCm,
      presionSistolica: form.pas,
      presionDiastolica: form.pad,
      fc: form.fc,
      temperatura: form.temp,
      spo2: form.spo2,
      glucosaMgDl: form.glucosa,
    });
    const nueva: Consulta = {
      id: `cm-${Date.now()}`,
      pacienteId: p.id,
      medico: form.medico,
      fecha: HOY_MED,
      motivo: form.motivo || 'Consulta',
      diagnostico: form.diagnostico,
      tratamientoRealizado: form.tratamientoRealizado,
      tratamientoPendiente: form.tratamientoPendiente,
      notasEvolucion: form.notasEvolucion,
      medicamentosRecetados: meds.filter((m) => m.nombre.trim()),
      proximaCita: form.proximaCita,
      costo: form.costo,
      pagado: form.pagado,
      saldo,
      archivos: [],
      signosVitales: sv,
    };
    addConsulta(nueva);
    setOpenNueva(false);
    setToast('Consulta registrada');
    setTimeout(() => setToast(null), 2500);
  };

  const pdfExp = async () => {
    if (!p) return;
    await generarExpedientePdfMedico(p, consultasDePaciente(consultas, p.id));
  };

  const wa = p
    ? `https://wa.me/52${p.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + p.nombre + ', le escribimos de Salud+.')}`
    : '#';

  const metricKey = metric === 'peso' ? 'peso' : metric === 'presion' ? 'presion' : 'glucosa';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <label className="text-xs text-slate-400">Buscar paciente</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre o folio EXP-…"
          className="mt-1 w-full max-w-xl rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {filtrados.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setSelId(x.id)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                selId === x.id ? 'border-emerald-500 text-emerald-200 bg-emerald-950/40' : 'border-white/10 text-slate-400'
              }`}
            >
              {x.folio} · {x.nombre}
            </button>
          ))}
        </div>
      </div>

      {!p && <p className="text-slate-500 text-sm">Selecciona un paciente para ver el expediente.</p>}

      {p && (
        <>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-emerald-300">Expediente clínico</h2>
              <span className="text-sm text-slate-400">Folio: {p.folio}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-slate-500">Nombre:</span> <span className="text-white font-medium">{p.nombre}</span>
              </p>
              <p>
                <span className="text-slate-500">Edad:</span> {p.edad} años
              </p>
              <p>
                <span className="text-slate-500">Fecha nac.:</span> {p.fechaNacimiento}
              </p>
              <p>
                <span className="text-slate-500">Sexo:</span> {p.sexo === 'F' ? 'Femenino' : 'Masculino'}
              </p>
              <p>
                <span className="text-slate-500">Tel:</span> {p.telefono}
              </p>
              <p>
                <span className="text-slate-500">Email:</span> {p.email}
              </p>
              <p>
                <span className="text-slate-500">Grupo sanguíneo:</span> {p.grupoSanguineo}
              </p>
              <p>
                <span className="text-slate-500">Médico tratante:</span> {p.medicoTratante}
              </p>
              <p>
                <span className="text-slate-500">Especialidad:</span> {p.especialidad}
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/30 p-4">
              <p className="text-red-300 font-semibold text-sm mb-2">⚠️ Alertas médicas</p>
              <p className="text-sm">
                <span className="text-slate-400">Alérgico/a a:</span> {p.alergias.filter((a) => a !== 'Ninguna').join(', ') || 'Ninguna declarada'}
              </p>
              <p className="text-sm mt-1">
                <span className="text-slate-400">Padecimientos:</span>{' '}
                {p.enfermedades.filter((e) => e !== 'Ninguna').join(', ') || 'Ninguno'}
              </p>
              <p className="text-sm mt-1">
                <span className="text-slate-400">Medicamentos actuales:</span>{' '}
                {p.medicamentos.filter((m) => m !== 'Ninguno').join(', ') || 'Ninguno'}
              </p>
            </div>
            <p className="text-sm mt-4 text-slate-400">
              Contacto emergencia: {p.contactoEmergencia.nombre} ({p.contactoEmergencia.parentesco}){' '}
              {p.contactoEmergencia.telefono}
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h3 className="font-semibold">Antecedentes heredofamiliares</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              {(['madre', 'padre', 'hermanos'] as const).map((fam) => (
                <div key={fam} className="rounded-lg border border-white/10 p-3 space-y-2 capitalize">
                  <p className="text-emerald-400 font-medium">{fam}</p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" readOnly checked={p.heredofamiliares[fam].diabetes} className="accent-emerald-500" />
                    Diabetes
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" readOnly checked={p.heredofamiliares[fam].hipertension} className="accent-emerald-500" />
                    Hipertensión
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" readOnly checked={p.heredofamiliares[fam].cancer} className="accent-emerald-500" />
                    Cáncer
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" readOnly checked={p.heredofamiliares[fam].cardiopatias} className="accent-emerald-500" />
                    Cardiopatías
                  </label>
                </div>
              ))}
            </div>
            <h3 className="font-semibold pt-2">Antecedentes personales</h3>
            <div className="text-sm space-y-2 text-slate-300">
              <p>
                <span className="text-slate-500">Cirugías previas:</span> {p.cirugiasPrevias}
              </p>
              <p>
                <span className="text-slate-500">Hospitalizaciones:</span> {p.hospitalizaciones}
              </p>
              <p>
                <span className="text-slate-500">Vacunas / notas:</span> {p.vacunasNotas}
              </p>
              {p.sexo === 'F' && (
                <p>
                  <span className="text-slate-500">Métodos anticonceptivos (nota):</span> {p.metodoAnticonceptivoGeneral}
                </p>
              )}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            {(['general', 'ginecologia', 'cardiologia', 'pediatria'] as TabEsp[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTabEsp(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  tabEsp === t ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {TAB_LABEL[t]}
                {p.especialidad === t && ' · principal'}
              </button>
            ))}
          </div>

          {tabEsp === 'ginecologia' && (
            <section className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/10 p-6 space-y-3">
              <h3 className="font-semibold text-fuchsia-200">Ginecología</h3>
              {p.datosGine ? (
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
                  <p>Última menstruación: {p.datosGine.fechaUltimaMenstruacion}</p>
                  <p>Ciclo: {p.datosGine.cicloDias} días</p>
                  <p>Método anticonceptivo: {p.datosGine.metodoAnticonceptivo}</p>
                  <p>
                    GPCA: G{p.datosGine.gestas} P{p.datosGine.partos} C{p.datosGine.cesareas} A{p.datosGine.abortos}
                  </p>
                  <p>Último Papanicolaou: {p.datosGine.fechaUltimoPapanicolau}</p>
                  <p>Resultado: {p.datosGine.resultadoPapanicolau}</p>
                  <p>Última mastografía: {p.datosGine.fechaUltimaMastografia}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin datos ginecológicos registrados para este paciente (demo).</p>
              )}
            </section>
          )}

          {tabEsp === 'cardiologia' && (
            <section className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 space-y-4">
              <h3 className="font-semibold text-rose-200">Cardiología</h3>
              <EcgSvg className="w-full max-h-32 rounded-lg border border-white/10" />
              {p.datosCardio ? (
                <>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Factores de riesgo cardiovascular</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(p.datosCardio.factoresRiesgo).map(([k, v]) => (
                        <span
                          key={k}
                          className={`px-2 py-1 rounded-full border ${v ? 'border-rose-400/50 text-rose-200' : 'border-white/10 text-slate-500'}`}
                        >
                          {k}: {flagLabel(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Medicación cardiológica actual</p>
                    <ul className="list-disc list-inside text-sm text-slate-300">
                      {p.datosCardio.medicacionActual.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Sin bloque cardiológico extendido (demo).</p>
              )}
            </section>
          )}

          {tabEsp === 'pediatria' && (
            <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-6 space-y-4">
              <h3 className="font-semibold text-cyan-200">Pediatría</h3>
              {p.datosPediatria ? (
                <>
                  <p className="text-sm text-slate-300">
                    Peso al nacer: {p.datosPediatria.pesoAlNacerKg} kg · Talla al nacer: {p.datosPediatria.tallaAlNacerCm} cm
                  </p>
                  <p className="text-sm text-slate-300">Desarrollo psicomotor: {p.datosPediatria.desarrolloPsicomotor}</p>
                  <div className="h-56">
                    <p className="text-xs text-slate-400 mb-2">Curva de crecimiento (peso vs percentiles mock)</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={growthPed}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                        <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                        <Legend />
                        <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#22d3ee" strokeWidth={2} dot />
                        <Line type="monotone" dataKey="p50" name="Percentil 50 (mock)" stroke="#64748b" strokeDasharray="4 4" dot={false} />
                        <Line type="monotone" dataKey="p75" name="Percentil 75 (mock)" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Esquema de vacunación</p>
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-500">
                            <th className="p-2 text-left">Vacuna</th>
                            <th className="p-2 text-left">Fecha</th>
                            <th className="p-2 text-left">Lote</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.datosPediatria.vacunacion.map((v) => (
                            <tr key={v.vacuna + v.fecha} className="border-b border-white/5">
                              <td className="p-2">{v.vacuna}</td>
                              <td className="p-2">{v.fecha}</td>
                              <td className="p-2">{v.lote ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Sin datos pediátricos (demo).</p>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-semibold mb-4">Evolución de signos vitales</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['peso', 'presion', 'glucosa'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    metric === m ? 'border-emerald-500 text-emerald-200' : 'border-white/10 text-slate-500'
                  }`}
                >
                  {m === 'peso' ? 'Peso' : m === 'presion' ? 'Presión sistólica' : 'Glucosa'}
                </button>
              ))}
            </div>
            {chartRows.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                    <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Line
                      type="monotone"
                      dataKey={metricKey}
                      name={metric === 'peso' ? 'Peso (kg)' : metric === 'presion' ? 'PA sistólica' : 'Glucosa'}
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin datos suficientes para gráfica.</p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-semibold mb-6">Historial de consultas</h3>
            <div className="relative border-l border-white/10 ml-3 space-y-6 pl-8">
              {hist.map((c) => (
                <TimelineItem key={c.id} c={c} expanded={expId === c.id} onToggle={() => setExpId(expId === c.id ? null : c.id)} />
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setOpenNueva((v) => !v)}
              className="px-4 py-2 rounded-xl font-semibold text-white"
              style={{ background: ACCENT }}
            >
              Registrar nueva consulta
            </button>
          </div>

          <AnimatePresence>
            {openNueva && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4"
              >
                <h4 className="font-semibold">Nueva consulta</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Médico</label>
                    <select
                      value={form.medico}
                      onChange={(e) => setForm((f) => ({ ...f, medico: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    >
                      {MEDICOS.map((d) => (
                        <option key={d.id} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Motivo</label>
                    <input
                      value={form.motivo}
                      onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 p-3 space-y-2">
                  <p className="text-xs text-emerald-400 font-medium">Signos vitales de esta consulta</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <label>
                      Peso (kg)
                      <input
                        type="number"
                        value={form.pesoKg}
                        onChange={(e) => setForm((f) => ({ ...f, pesoKg: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      Talla (cm)
                      <input
                        type="number"
                        value={form.tallaCm}
                        onChange={(e) => setForm((f) => ({ ...f, tallaCm: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      PAS
                      <input
                        type="number"
                        value={form.pas}
                        onChange={(e) => setForm((f) => ({ ...f, pas: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      PAD
                      <input
                        type="number"
                        value={form.pad}
                        onChange={(e) => setForm((f) => ({ ...f, pad: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      FC
                      <input
                        type="number"
                        value={form.fc}
                        onChange={(e) => setForm((f) => ({ ...f, fc: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      Temp °C
                      <input
                        type="number"
                        step={0.1}
                        value={form.temp}
                        onChange={(e) => setForm((f) => ({ ...f, temp: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      SpO₂
                      <input
                        type="number"
                        value={form.spo2}
                        onChange={(e) => setForm((f) => ({ ...f, spo2: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                    <label>
                      Glucosa
                      <input
                        type="number"
                        value={form.glucosa}
                        onChange={(e) => setForm((f) => ({ ...f, glucosa: Number(e.target.value) || 0 }))}
                        className="mt-0.5 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Diagnóstico</label>
                  <textarea
                    value={form.diagnostico}
                    onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Tratamiento realizado</label>
                  <textarea
                    value={form.tratamientoRealizado}
                    onChange={(e) => setForm((f) => ({ ...f, tratamientoRealizado: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Tratamiento pendiente</label>
                  <textarea
                    value={form.tratamientoPendiente}
                    onChange={(e) => setForm((f) => ({ ...f, tratamientoPendiente: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Notas de evolución</label>
                  <textarea
                    value={form.notasEvolucion}
                    onChange={(e) => setForm((f) => ({ ...f, notasEvolucion: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Medicamentos recetados</p>
                  {meds.map((m, i) => (
                    <div key={i} className="flex flex-wrap gap-2 mb-2">
                      <input
                        placeholder="Nombre"
                        value={m.nombre}
                        onChange={(e) => {
                          const x = [...meds];
                          x[i] = { ...x[i]!, nombre: e.target.value };
                          setMeds(x);
                        }}
                        className="flex-1 min-w-[120px] rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs"
                      />
                      <input
                        placeholder="Dosis"
                        value={m.dosis}
                        onChange={(e) => {
                          const x = [...meds];
                          x[i] = { ...x[i]!, dosis: e.target.value };
                          setMeds(x);
                        }}
                        className="w-24 rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs"
                      />
                      <input
                        placeholder="Frecuencia"
                        value={m.frecuencia}
                        onChange={(e) => {
                          const x = [...meds];
                          x[i] = { ...x[i]!, frecuencia: e.target.value };
                          setMeds(x);
                        }}
                        className="w-28 rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Días"
                        value={m.dias || ''}
                        onChange={(e) => {
                          const x = [...meds];
                          x[i] = { ...x[i]!, dias: Number(e.target.value) || 0 };
                          setMeds(x);
                        }}
                        className="w-16 rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs text-emerald-400"
                    onClick={() => setMeds([...meds, { nombre: '', dosis: '', frecuencia: '', dias: 0 }])}
                  >
                    + Agregar medicamento
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Próxima cita</label>
                    <input
                      value={form.proximaCita}
                      onChange={(e) => setForm((f) => ({ ...f, proximaCita: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Costo</label>
                    <input
                      type="number"
                      value={form.costo || ''}
                      onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) || 0 }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Pagado</label>
                    <input
                      type="number"
                      value={form.pagado || ''}
                      onChange={(e) => setForm((f) => ({ ...f, pagado: Number(e.target.value) || 0 }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button type="button" onClick={guardarConsulta} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: ACCENT }}>
                  Guardar consulta
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => void pdfExp()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm">
              <FileDown className="w-4 h-4" />
              Generar PDF del expediente
            </button>
            <Link href="/demo/medico/recetas" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm">
              <Pill className="w-4 h-4" />
              Nueva receta
            </Link>
            <Link href="/demo/medico/agenda" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm">
              <Calendar className="w-4 h-4" />
              Agendar cita
            </Link>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/40 text-emerald-300 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function ExpedientePage() {
  return (
    <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando expediente…</div>}>
      <ExpedienteInner />
    </Suspense>
  );
}

function TimelineItem({
  c,
  expanded,
  onToggle,
}: {
  c: Consulta;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-[#0a0f1a]" />
      <div className="rounded-xl border border-white/10 bg-[#0c1220] p-4">
        <p className="text-xs text-emerald-400 font-medium">{c.fecha}</p>
        <p className="text-sm font-semibold mt-1">
          {c.medico} · {c.motivo}
        </p>
        <VitalsTable sv={c.signosVitales} />
        <p className="text-xs text-slate-400 mt-2">Diagnóstico: {c.diagnostico}</p>
        <p className="text-xs text-slate-400">Tratamiento: {c.tratamientoRealizado}</p>
        {c.medicamentosRecetados.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">Medicamentos: {c.medicamentosRecetados.map((m) => m.nombre).join(', ')}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Costo: ${c.costo} · Pagado: ${c.pagado} · Saldo: ${c.saldo}
        </p>
        <button type="button" onClick={onToggle} className="text-xs text-emerald-400 mt-2">
          {expanded ? 'Ocultar notas ▲' : 'Ver notas completas ▼'}
        </button>
        {expanded && (
          <div className="mt-3 text-xs text-slate-400 border-t border-white/10 pt-3 space-y-1">
            <p>Pendiente: {c.tratamientoPendiente || '—'}</p>
            <p>Evolución: {c.notasEvolucion}</p>
            <p>Próxima cita: {c.proximaCita}</p>
          </div>
        )}
      </div>
    </div>
  );
}
