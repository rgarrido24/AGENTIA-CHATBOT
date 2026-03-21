'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, FileDown, MessageCircle, Pill } from 'lucide-react';
import { generarExpedientePdf } from '@/lib/dentista-pdf';
import {
  DENTISTAS,
  HOY_DENT,
  MOCK_ODONTOGRAMAS,
  consultasDePaciente,
  type Consulta,
  type MedicamentoReceta,
} from '@/lib/mock-data-dentista';
import { useDentista } from '../dentista-context';
import Odontograma from '../components/Odontograma';

const ACCENT = '#0284c7';

type NuevaConsultaForm = {
  dentista: string;
  motivo: string;
  diagnostico: string;
  tratamientoRealizado: string;
  tratamientoPendiente: string;
  notasEvolucion: string;
  proximaCita: string;
  costo: number;
  pagado: number;
};

function ExpedienteInner() {
  const sp = useSearchParams();
  const { pacientes, consultas, addConsulta } = useDentista();
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [openNueva, setOpenNueva] = useState(false);
  const [expId, setExpId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = sp.get('paciente');
    if (id) setSelId(id);
  }, [sp]);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return pacientes.slice(0, 12);
    return pacientes.filter((p) => p.nombre.toLowerCase().includes(qq) || p.folio.toLowerCase().includes(qq));
  }, [q, pacientes]);

  const p = selId ? pacientes.find((x) => x.id === selId) : undefined;
  const odo = selId ? MOCK_ODONTOGRAMAS[selId] : undefined;
  const hist = selId ? consultasDePaciente(consultas, selId) : [];

  const [form, setForm] = useState<NuevaConsultaForm>({
    dentista: DENTISTAS[0]!.nombre,
    motivo: '',
    diagnostico: '',
    tratamientoRealizado: '',
    tratamientoPendiente: '',
    notasEvolucion: '',
    proximaCita: '',
    costo: 0,
    pagado: 0,
  });
  const [meds, setMeds] = useState<MedicamentoReceta[]>([
    { nombre: '', dosis: '', frecuencia: '', dias: 0 },
  ]);

  const guardarConsulta = () => {
    if (!p) return;
    const saldo = Math.max(0, form.costo - form.pagado);
    const nueva: Consulta = {
      id: `co-${Date.now()}`,
      pacienteId: p.id,
      dentista: form.dentista,
      fecha: HOY_DENT,
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
    };
    addConsulta(nueva);
    setOpenNueva(false);
    setToast('Consulta registrada');
    setTimeout(() => setToast(null), 2500);
  };

  const pdfExp = async () => {
    if (!p) return;
    await generarExpedientePdf(p, consultasDePaciente(consultas, p.id));
  };

  const wa = p
    ? `https://wa.me/52${p.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + p.nombre + ', le escribimos de Sonrisa Perfecta.')}`
    : '#';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <label className="text-xs text-slate-400">Buscar paciente</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre o folio PAC-…"
          className="mt-1 w-full max-w-xl rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {filtrados.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setSelId(x.id)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                selId === x.id ? 'border-sky-500 text-sky-200 bg-sky-950/40' : 'border-white/10 text-slate-400'
              }`}
            >
              {x.folio} · {x.nombre}
            </button>
          ))}
        </div>
      </div>

      {!p && <p className="text-slate-500 text-sm">Selecciona un paciente para ver el expediente.</p>}

      {p && odo && (
        <>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-sky-300">Expediente clínico</h2>
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
                <span className="text-slate-500">Dentista tratante:</span> {p.dentistaTratante}
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

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-semibold mb-4">Odontograma</h3>
            <Odontograma data={odo} />
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
                className="overflow-hidden rounded-2xl border border-sky-500/30 bg-sky-950/20 p-6 space-y-4"
              >
                <h4 className="font-semibold">Nueva consulta</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Dentista</label>
                    <select
                      value={form.dentista}
                      onChange={(e) => setForm((f) => ({ ...f, dentista: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    >
                      {DENTISTAS.map((d) => (
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
                    className="text-xs text-sky-400"
                    onClick={() => setMeds([...meds, { nombre: '', dosis: '', frecuencia: '', dias: 0 }])}
                  >
                    + Agregar medicamento
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Próxima cita (texto)</label>
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
            <button
              type="button"
              onClick={() => void pdfExp()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm"
            >
              <FileDown className="w-4 h-4" />
              Generar PDF del expediente
            </button>
            <Link href="/demo/dentista/recetas" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm">
              <Pill className="w-4 h-4" />
              Nueva receta
            </Link>
            <Link href="/demo/dentista/agenda" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm">
              <Calendar className="w-4 h-4" />
              Agendar cita
            </Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/40 text-emerald-300 text-sm">
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
      <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-sky-600 border-2 border-[#0a0f1a]" />
      <div className="rounded-xl border border-white/10 bg-[#0c1220] p-4">
        <p className="text-xs text-sky-400 font-medium">{c.fecha}</p>
        <p className="text-sm font-semibold mt-1">
          {c.dentista} · {c.motivo}
        </p>
        <p className="text-xs text-slate-400 mt-2">Diagnóstico: {c.diagnostico}</p>
        <p className="text-xs text-slate-400">Tratamiento: {c.tratamientoRealizado}</p>
        {c.medicamentosRecetados.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            Medicamentos:{' '}
            {c.medicamentosRecetados.map((m) => m.nombre).join(', ')}
          </p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Costo: ${c.costo} · Pagado: ${c.pagado} · Saldo: ${c.saldo}
        </p>
        <button type="button" onClick={onToggle} className="text-xs text-sky-400 mt-2">
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
