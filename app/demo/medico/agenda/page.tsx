'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useMemo, useState, type MouseEvent } from 'react';
import {
  MEDICOS,
  HOY_MED,
  addDays,
  formatISODate,
  parseISODate,
  startOfWeekMonday,
  type Cita,
  type TipoCitaMed,
} from '@/lib/mock-data-medico';
import { useMedico } from '../medico-context';

const ACCENT = '#16a34a';
const TIPOS: TipoCitaMed[] = [
  'Consulta',
  'Urgencia',
  'Control',
  'Procedimiento',
  'Valoración preoperatoria',
  'Electrocardiograma',
  'Ecografía',
  'Papanicolaou',
];

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function MedicoAgendaPage() {
  const { citas, addCita, pacientes } = useMedico();
  const getP = (id: string) => pacientes.find((x) => x.id === id);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(parseISODate(HOY_MED)));
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState<Cita | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => formatISODate(addDays(weekStart, i))),
    [weekStart]
  );

  const [form, setForm] = useState({
    pacienteId: 'pm1',
    medico: MEDICOS[0]!.nombre,
    fecha: HOY_MED,
    hora: '10:00',
    duracion: 30,
    tipo: 'Consulta' as TipoCitaMed,
    costo: 500,
    notas: '',
  });

  const prev = () => setWeekStart(addDays(weekStart, -7));
  const next = () => setWeekStart(addDays(weekStart, 7));

  const citasEn = (fecha: string, medico: string) =>
    citas.filter((c) => c.fecha === fecha && c.medico === medico && c.status !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));

  const guardar = () => {
    const nueva: Cita = {
      id: `cmed-${Date.now()}`,
      pacienteId: form.pacienteId,
      medico: form.medico,
      fecha: form.fecha,
      hora: form.hora,
      duracion: form.duracion,
      tipo: form.tipo,
      status: 'confirmada',
      costo: form.costo,
      notas: form.notas,
    };
    addCita(nueva);
    setModal(false);
    setToast('Cita agendada');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prev} className="p-2 rounded-lg border border-white/10 hover:bg-white/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03]">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">
              Semana del {diasSemana[0]} al {diasSemana[6]}
            </span>
          </div>
          <button type="button" onClick={next} className="p-2 rounded-lg border border-white/10 hover:bg-white/5">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white"
          style={{ background: ACCENT }}
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>

      <p className="text-xs text-slate-500">Vista semanal: una columna por médico; cada fila es un día.</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-xs min-w-[1100px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="p-2 text-left text-slate-400 w-24">Día</th>
              {MEDICOS.map((d) => (
                <th key={d.id} className="p-2 text-left text-emerald-300 font-medium min-w-[180px]">
                  {d.nombre}
                  <span className="block text-[10px] text-slate-500 font-normal">{d.especialidad}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diasSemana.map((fecha) => {
              const d = parseISODate(fecha);
              return (
                <tr key={fecha} className="border-b border-white/5 align-top">
                  <td className="p-2 text-slate-400 whitespace-nowrap">
                    {DIAS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                    <br />
                    <span className="text-white font-medium">{d.getDate()}</span>
                  </td>
                  {MEDICOS.map((doc) => (
                    <td key={doc.id} className="p-2">
                      <div className="space-y-1.5 min-h-[72px]">
                        {citasEn(fecha, doc.nombre).map((c) => {
                          const p = getP(c.pacienteId);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setDrawer(c)}
                              className="w-full text-left rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2 py-1.5 hover:bg-emerald-900/40"
                            >
                              <span className="font-mono text-emerald-300">{c.hora}</span> · {p?.nombre?.split(' ')[0]}
                              <span className="block text-[10px] text-slate-500">{c.tipo}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
          >
            <motion.div
              role="dialog"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1624] p-6 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Nueva cita</h2>
                <button type="button" onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-slate-400">Paciente</label>
                  <select
                    value={form.pacienteId}
                    onChange={(e) => setForm((f) => ({ ...f, pacienteId: e.target.value }))}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
                  >
                    {pacientes.map((px) => (
                      <option key={px.id} value={px.id}>
                        {px.folio} · {px.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Médico</label>
                  <select
                    value={form.medico}
                    onChange={(e) => setForm((f) => ({ ...f, medico: e.target.value }))}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
                  >
                    {MEDICOS.map((d) => (
                      <option key={d.id} value={d.nombre}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400">Fecha</label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-2 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Hora</label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-2 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoCitaMed }))}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Costo estimado (MXN)</label>
                  <input
                    type="number"
                    value={form.costo}
                    onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Duración (min)</label>
                  <input
                    type="number"
                    value={form.duracion}
                    onChange={(e) => setForm((f) => ({ ...f, duracion: Number(e.target.value) || 30 }))}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Notas</label>
                  <textarea
                    value={form.notas}
                    onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
                  />
                </div>
                <button type="button" onClick={guardar} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: ACCENT }}>
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-40 flex justify-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setDrawer(null)}
          >
            <motion.aside
              className="w-full max-w-sm h-full border-l border-white/10 bg-[#0c1220] p-6 overflow-y-auto"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">Detalle cita</h2>
                <button type="button" onClick={() => setDrawer(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              {drawer && (
                <>
                  <p className="text-sm text-slate-400">
                    {drawer.fecha} {drawer.hora}
                  </p>
                  <p className="text-lg font-medium mt-2">{getP(drawer.pacienteId)?.nombre}</p>
                  <p className="text-sm text-slate-400">{drawer.medico}</p>
                  <p className="text-sm mt-4">
                    {drawer.tipo} · ${drawer.costo}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{drawer.notas}</p>
                  <Link
                    href={`/demo/medico/expediente?paciente=${drawer.pacienteId}`}
                    onClick={() => setDrawer(null)}
                    className="mt-6 inline-block w-full text-center py-3 rounded-xl font-semibold text-white"
                    style={{ background: ACCENT }}
                  >
                    Ir al expediente
                  </Link>
                </>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
