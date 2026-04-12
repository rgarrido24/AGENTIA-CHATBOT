'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, FileDown, MessageCircle, Pill, X } from 'lucide-react';
import { generarExpedientePdf } from '@/lib/dentista-pdf';
import {
  DENTISTAS,
  HOY_DENT,
  MOCK_ODONTOGRAMAS,
  consultasDePaciente,
  type Consulta,
  type FotoEvolucion,
  type MedicamentoReceta,
  type Radiografia,
} from '@/lib/mock-data-dentista';
import { useDentista } from '../dentista-context';
import Odontograma from '../components/Odontograma';

const ACCENT = '#0284c7';

const TIPO_RX_LABEL: Record<Radiografia['tipo'], string> = {
  periapical: 'Periapical',
  panoramica: 'Panorámica',
  bitewing: 'Bitewing',
  cefalometrica: 'Cefalométrica',
};

// ── Sección Radiografías ──────────────────────────────────────────────────────
function SeccionRadiografias({ radiografias }: { radiografias: Radiografia[] }) {
  const [ampliada, setAmpliada] = useState<Radiografia | null>(null);
  const [subirOpen, setSubirOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [formRx, setFormRx] = useState({ tipo: 'periapical', diente: '', notas: '' });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">🩻 Radiografías</h3>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
            🔒 Confidencial — Solo el Dr.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSubirOpen(true)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
          style={{ background: ACCENT }}
        >
          + Subir radiografía
        </button>
      </div>

      {/* Grid */}
      {radiografias.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Sin radiografías registradas.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {radiografias.map((rx) => (
            <div
              key={rx.id}
              className="rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden flex flex-col"
            >
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rx.url}
                  alt={rx.nombre}
                  className="w-full object-cover"
                  style={{ aspectRatio: rx.tipo === 'panoramica' ? '2/1' : '4/3' }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setAmpliada(rx)}
                    className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30"
                  >
                    🔍 Ver ampliada
                  </button>
                </div>
                <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-sky-300">
                  {TIPO_RX_LABEL[rx.tipo]}
                </span>
              </div>
              <div className="p-3 flex-1 space-y-0.5">
                <p className="text-xs font-semibold text-white leading-tight">{rx.nombre}</p>
                {rx.diente && <p className="text-[11px] text-slate-400">Diente: {rx.diente}</p>}
                <p className="text-[11px] text-slate-500">{rx.fecha}</p>
                {rx.notas && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{rx.notas}</p>}
              </div>
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => setAmpliada(rx)}
                  className="w-full text-xs py-1.5 rounded-lg border border-white/10 text-sky-400 hover:bg-white/5 transition-colors"
                >
                  🔍 Ver ampliada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal imagen ampliada */}
      <AnimatePresence>
        {ampliada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setAmpliada(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0c1220] rounded-2xl border border-white/10 max-w-2xl w-full overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <p className="font-semibold text-sm">{ampliada.nombre}</p>
                <button type="button" onClick={() => setAmpliada(null)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ampliada.url} alt={ampliada.nombre} className="w-full" />
              <div className="px-5 py-4 space-y-1 text-sm">
                <div className="flex flex-wrap gap-3">
                  <span className="text-slate-400">Tipo: <span className="text-white">{TIPO_RX_LABEL[ampliada.tipo]}</span></span>
                  {ampliada.diente && <span className="text-slate-400">Diente: <span className="text-white">{ampliada.diente}</span></span>}
                  <span className="text-slate-400">Fecha: <span className="text-white">{ampliada.fecha}</span></span>
                </div>
                {ampliada.notas && (
                  <p className="text-slate-300 mt-2 leading-relaxed">{ampliada.notas}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal subir radiografía (simulado) */}
      <AnimatePresence>
        {subirOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSubirOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-[#0c1220] rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Subir radiografía</h4>
                <button type="button" onClick={() => setSubirOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                <select
                  value={formRx.tipo}
                  onChange={(e) => setFormRx((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                >
                  <option value="periapical">Periapical</option>
                  <option value="panoramica">Panorámica</option>
                  <option value="bitewing">Bitewing</option>
                  <option value="cefalometrica">Cefalométrica</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Diente(s) — ej: 16, 17</label>
                <input
                  value={formRx.diente}
                  onChange={(e) => setFormRx((f) => ({ ...f, diente: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas del Dr.</label>
                <textarea
                  value={formRx.notas}
                  onChange={(e) => setFormRx((f) => ({ ...f, notas: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm resize-none"
                />
              </div>
              <button
                type="button"
                className="w-full py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:bg-white/5 transition-colors"
              >
                📎 Seleccionar archivo — (demo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubirOpen(false);
                  showToast('Radiografía guardada ✓');
                  setFormRx({ tipo: 'periapical', diente: '', notas: '' });
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: ACCENT }}
              >
                Guardar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-sm">
          {toast}
        </div>
      )}
    </section>
  );
}

// ── Sección Evolución del Tratamiento ─────────────────────────────────────────
function SeccionEvolucion({ fotos, pacienteNombre, pacienteTelefono }: {
  fotos: FotoEvolucion[];
  pacienteNombre: string;
  pacienteTelefono: string;
}) {
  if (fotos.length === 0) return null;

  const antes = fotos.find((f) => f.tipo === 'antes');
  const durante = fotos.find((f) => f.tipo === 'durante');
  const despues = fotos.find((f) => f.tipo === 'despues');
  const tratamiento = fotos[0]!.tratamiento;

  const soloAntes = antes && !durante && !despues;
  const waText = encodeURIComponent(
    `¡Hola ${pacienteNombre}! 😊 Queremos compartirte tu progreso. Tu tratamiento de ${tratamiento} va muy bien. Puedes notar la evolución desde el inicio del tratamiento. ¡Sigue así! — Clínica Sonrisa Perfecta`
  );
  const waUrl = `https://wa.me/52${pacienteTelefono.replace(/\D/g, '')}?text=${waText}`;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">📸 Evolución del Tratamiento</h3>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            👁️ Compartido — Dr. y Paciente
          </span>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-950/40 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Compartir progreso por WhatsApp
        </a>
      </div>

      <p className="text-sm text-slate-400">
        Tratamiento: <span className="text-white font-medium">{tratamiento}</span>
      </p>

      {/* Comparador lado a lado (antes + después) */}
      {antes && despues && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.02] text-center">
            <p className="text-xs font-semibold text-slate-300">Evolución — {pacienteNombre}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/10">
            {/* Antes */}
            <div className="space-y-0">
              <div className="px-3 py-2 bg-red-950/20 border-b border-white/10 text-center">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Antes</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={antes.url} alt="Antes" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
              <div className="px-3 py-2">
                <p className="text-[11px] text-slate-500 text-center">{antes.fecha}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{antes.descripcion}</p>
              </div>
            </div>
            {/* Después */}
            <div className="space-y-0">
              <div className="px-3 py-2 bg-emerald-950/20 border-b border-white/10 text-center">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Después</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={despues.url} alt="Después" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
              <div className="px-3 py-2">
                <p className="text-[11px] text-slate-500 text-center">{despues.fecha}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{despues.descripcion}</p>
              </div>
            </div>
          </div>
          {/* Foto "durante" debajo si existe */}
          {durante && (
            <div className="border-t border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 text-center">📍 Durante el tratamiento</p>
              <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={durante.url} alt="Durante" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
                <div className="px-3 py-2">
                  <p className="text-[11px] text-slate-500 text-center">{durante.fecha}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{durante.descripcion}</p>
                </div>
              </div>
              {/* Timeline */}
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-[10px] text-slate-500 w-16 text-right">{antes.fecha}</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                </div>
                <span className="text-[10px] text-slate-500 w-16">{despues.fecha}</span>
              </div>
            </div>
          )}
          {/* Timeline sin "durante" */}
          {!durante && (
            <div className="border-t border-white/10 px-6 py-3 flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-16 text-right">{antes.fecha}</span>
              <div className="flex-1 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                <div className="flex-1 h-px bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
              </div>
              <span className="text-[10px] text-slate-500 w-16">{despues.fecha}</span>
            </div>
          )}
        </div>
      )}

      {/* Solo antes (en tratamiento) */}
      {soloAntes && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 overflow-hidden max-w-sm">
          <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-500/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Estado inicial registrado</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-300 border border-amber-700">
              En tratamiento 🔄
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={antes.url} alt="Antes" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
          <div className="p-3">
            <p className="text-[11px] text-slate-500">{antes.fecha}</p>
            <p className="text-xs text-slate-400 mt-1">{antes.descripcion}</p>
          </div>
        </div>
      )}

      {/* Solo antes + durante (sin después) */}
      {antes && durante && !despues && (
        <div className="grid grid-cols-2 gap-4">
          {[antes, durante].map((f) => (
            <div key={f.id} className="rounded-xl border border-white/10 overflow-hidden">
              <div className={`px-3 py-2 border-b border-white/10 text-center ${f.tipo === 'antes' ? 'bg-red-950/20' : 'bg-amber-950/20'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${f.tipo === 'antes' ? 'text-red-300' : 'text-amber-300'}`}>
                  {f.tipo === 'antes' ? 'Antes' : 'Durante'}
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.tipo} className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
              <div className="p-3">
                <p className="text-[11px] text-slate-500 text-center">{f.fecha}</p>
                <p className="text-xs text-slate-400 mt-1">{f.descripcion}</p>
              </div>
            </div>
          ))}
          <div className="col-span-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-amber-900/30 text-amber-300 border border-amber-700">
              En tratamiento 🔄 — Fotos de resultado próximamente
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

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

          <SeccionRadiografias radiografias={p.radiografias} />

          <SeccionEvolucion
            fotos={p.fotosEvolucion}
            pacienteNombre={p.nombre}
            pacienteTelefono={p.telefono}
          />

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
