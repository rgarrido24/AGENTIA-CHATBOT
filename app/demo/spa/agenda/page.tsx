'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  FECHA_REF_DASHBOARD,
  addDays,
  especialistaPuedeEnHorario,
  formatISODate,
  getCliente,
  getEspecialista,
  getServicio,
  hayTraslape,
  horaAMinutos,
  HORAS_AGENDA,
  labelSemana,
  MOCK_CLIENTES,
  MOCK_ESPECIALISTAS,
  MOCK_SERVICIOS,
  parseISODate,
  startOfWeekMonday,
  type Cita,
} from '@/lib/mock-data-spa';
import { useSpa } from '../spa-context';

const ACCENT = '#9333ea';
const PINK = '#ec4899';

const ESP_COLOR: Record<string, string> = {
  e1: 'bg-violet-600 border-violet-400',
  e2: 'bg-fuchsia-600 border-fuchsia-400',
  e3: 'bg-purple-600 border-purple-400',
  e4: 'bg-pink-600 border-pink-400',
  e5: 'bg-indigo-600 border-indigo-400',
};

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function statusLabel(s: Cita['status']) {
  const m: Record<Cita['status'], string> = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  return m[s];
}

function statusClass(s: Cita['status']) {
  const m: Record<Cita['status'], string> = {
    confirmada: 'bg-violet-500/25 text-violet-200 border-violet-500/40',
    pendiente: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    completada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    cancelada: 'bg-slate-600/40 text-slate-400 border-slate-500/40',
  };
  return m[s];
}

const MIN_DIA = 8 * 60;
/** 8:00–20:00 = 720 min */
const PX_POR_MIN = 1.2;
const ALTURA_DIA = (20 - 8) * 60 * PX_POR_MIN;
const ROW_H = ALTURA_DIA / 12;

export default function SpaAgendaPage() {
  const { citas, addCita, updateCita } = useSpa();
  const [selectedDay, setSelectedDay] = useState(FECHA_REF_DASHBOARD);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(parseISODate(FECHA_REF_DASHBOARD)));
  const [view, setView] = useState<'week' | 'day' | 'list'>('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerCita, setDrawerCita] = useState<Cita | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clienteQ, setClienteQ] = useState('');
  const [form, setForm] = useState({
    clienteId: '',
    servicioId: '',
    especialistaId: '',
    fecha: FECHA_REF_DASHBOARD,
    hora: '10:00',
    notas: '',
  });

  useEffect(() => {
    setWeekStart(startOfWeekMonday(parseISODate(selectedDay)));
  }, [selectedDay]);

  const diasSemana = useMemo(() => Array.from({ length: 7 }, (_, i) => formatISODate(addDays(weekStart, i))), [weekStart]);

  const citasDelDia = useMemo(
    () => citas.filter((c) => c.fecha === selectedDay).sort((a, b) => a.hora.localeCompare(b.hora)),
    [citas, selectedDay]
  );

  const prevWeek = () => {
    const n = addDays(weekStart, -7);
    setWeekStart(n);
    setSelectedDay(formatISODate(n));
  };
  const nextWeek = () => {
    const n = addDays(weekStart, 7);
    setWeekStart(n);
    setSelectedDay(formatISODate(n));
  };

  const servicioSel = MOCK_SERVICIOS.find((s) => s.id === form.servicioId);
  const startMinForm = horaAMinutos(form.hora);

  const especialistasFiltrados = useMemo(() => {
    if (!servicioSel) return MOCK_ESPECIALISTAS;
    const dur = servicioSel.duracion;
    return MOCK_ESPECIALISTAS.filter((e) => {
      if (!especialistaPuedeEnHorario(e, startMinForm, dur)) return false;
      if (hayTraslape(citas, e.id, form.fecha, startMinForm, dur, editingId ?? undefined)) return false;
      return true;
    });
  }, [servicioSel, startMinForm, form.fecha, citas, editingId]);

  const clientesFiltrados = useMemo(() => {
    const q = clienteQ.trim().toLowerCase();
    if (!q) return MOCK_CLIENTES.slice(0, 8);
    return MOCK_CLIENTES.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q) || c.email.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [clienteQ]);

  const confirmarCita = () => {
    if (!form.clienteId || !form.servicioId || !form.especialistaId || !servicioSel) {
      setToast('Completa cliente, servicio y especialista');
      return;
    }
    if (hayTraslape(citas, form.especialistaId, form.fecha, startMinForm, servicioSel.duracion, editingId ?? undefined)) {
      setToast('Hay traslape con otra cita para ese especialista');
      return;
    }
    const esp = getEspecialista(form.especialistaId);
    if (!esp || !especialistaPuedeEnHorario(esp, startMinForm, servicioSel.duracion)) {
      setToast('Especialista no disponible en ese horario');
      return;
    }
    if (editingId) {
      updateCita(editingId, {
        clienteId: form.clienteId,
        servicioId: form.servicioId,
        especialistaId: form.especialistaId,
        fecha: form.fecha,
        hora: form.hora,
        duracion: servicioSel.duracion,
        precio: servicioSel.precio,
        notas: form.notas.trim(),
        status: 'confirmada',
      });
      setToast('Cita actualizada ✅');
    } else {
      const nueva: Cita = {
        id: `ct-${Date.now()}`,
        clienteId: form.clienteId,
        servicioId: form.servicioId,
        especialistaId: form.especialistaId,
        fecha: form.fecha,
        hora: form.hora,
        duracion: servicioSel.duracion,
        precio: servicioSel.precio,
        status: 'confirmada',
        notas: form.notas.trim(),
      };
      addCita(nueva);
      setToast('Cita agendada ✅');
    }
    setModalOpen(false);
    setForm((f) => ({ ...f, notas: '' }));
    setEditingId(null);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const citasEnColumnaDia = useCallback(
    (fecha: string) => citas.filter((c) => c.fecha === fecha && c.status !== 'cancelada'),
    [citas]
  );

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={prevWeek}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03]">
            <Calendar className="w-4 h-4 text-fuchsia-400" />
            <span className="text-sm font-medium">Semana del {labelSemana(weekStart)}</span>
          </div>
          <button
            type="button"
            onClick={nextWeek}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['week', 'day', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                view === v ? 'text-white border-transparent' : 'border-white/10 text-slate-400 hover:bg-white/5'
              }`}
              style={view === v ? { background: ACCENT } : undefined}
            >
              {v === 'week' ? 'Vista semana' : v === 'day' ? 'Vista día' : 'Vista lista'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm((f) => ({ ...f, fecha: selectedDay }));
              setClienteQ('');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PINK})` }}
          >
            <Plus className="w-4 h-4" />
            Nueva cita
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Día seleccionado:{' '}
        <button type="button" className="text-fuchsia-300 underline" onClick={() => setView('list')}>
          {selectedDay}
        </button>
      </p>

      {view === 'week' && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
          <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 min-w-[860px]">
            <div />
            <div className="grid grid-cols-7 gap-1">
              {diasSemana.map((iso, i) => {
                const d = parseISODate(iso);
                const active = iso === selectedDay;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDay(iso)}
                    className={`text-center py-2 text-xs rounded-t-lg ${active ? 'bg-violet-600/30' : 'hover:bg-white/5'}`}
                  >
                    <div className="text-slate-500">{DIAS_CORTO[i]}</div>
                    <div className="font-semibold">{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col" style={{ height: ALTURA_DIA }}>
              {HORAS_AGENDA.map((h) => (
                <div
                  key={h}
                  className="text-[10px] text-slate-500 pr-1 text-right border-b border-white/5 flex items-start justify-end pt-0.5"
                  style={{ height: ROW_H }}
                >
                  {h}:00
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {diasSemana.map((iso) => (
                <div
                  key={iso}
                  className="relative rounded-lg border border-white/10 bg-[#0a0f1a]/90 overflow-hidden"
                  style={{ height: ALTURA_DIA }}
                >
                  {HORAS_AGENDA.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-b border-white/5 pointer-events-none"
                      style={{ top: (h * 60 - MIN_DIA) * PX_POR_MIN, height: ROW_H }}
                    />
                  ))}
                  {citasEnColumnaDia(iso).map((c) => {
                    const s = getServicio(c.servicioId);
                    const cl = getCliente(c.clienteId);
                    const top = (horaAMinutos(c.hora) - MIN_DIA) * PX_POR_MIN;
                    const hgt = c.duracion * PX_POR_MIN;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDrawerCita(c)}
                        className={`absolute left-0.5 right-0.5 rounded border text-left px-1 py-0.5 text-[10px] leading-tight text-white shadow ${ESP_COLOR[c.especialistaId] ?? 'bg-slate-600'}`}
                        style={{ top, height: Math.max(hgt, 28), zIndex: 2 }}
                      >
                        <div className="font-semibold truncate">{cl?.nombre ?? '—'}</div>
                        <div className="opacity-90 truncate">{s?.nombre ?? '—'}</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 min-w-[720px]">
            <div className="flex flex-col shrink-0 w-12" style={{ height: ALTURA_DIA }}>
              {HORAS_AGENDA.map((h) => (
                <div
                  key={h}
                  className="text-[10px] text-slate-500 text-right pr-1 border-b border-white/5"
                  style={{ height: ROW_H }}
                >
                  {h}:00
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 flex-1">
              {MOCK_ESPECIALISTAS.map((e) => (
                <div key={e.id} className="min-w-[120px]">
                  <div className="text-center text-xs font-medium text-fuchsia-200/90 pb-2 border-b border-white/10 mb-1">
                    <span className="text-lg mr-1">{e.foto}</span>
                    {e.nombre.split(' ')[0]}
                  </div>
                  <div className="relative rounded-lg border border-white/10 bg-[#0a0f1a]/90" style={{ height: ALTURA_DIA }}>
                    {HORAS_AGENDA.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-b border-white/5 pointer-events-none"
                        style={{ top: (h * 60 - MIN_DIA) * PX_POR_MIN, height: ROW_H }}
                      />
                    ))}
                    {citas
                      .filter((c) => c.fecha === selectedDay && c.especialistaId === e.id && c.status !== 'cancelada')
                      .map((c) => {
                        const s = getServicio(c.servicioId);
                        const cl = getCliente(c.clienteId);
                        const top = (horaAMinutos(c.hora) - MIN_DIA) * PX_POR_MIN;
                        const blk = c.duracion * PX_POR_MIN;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setDrawerCita(c)}
                            className={`absolute left-0.5 right-0.5 rounded border px-1 py-1 text-left text-[10px] text-white ${ESP_COLOR[e.id]}`}
                            style={{ top, height: Math.max(blk, 32), zIndex: 2 }}
                          >
                            <div className="font-semibold truncate">{cl?.nombre}</div>
                            <div className="opacity-90 truncate">{s?.nombre}</div>
                            <div className="text-[9px] opacity-80">{c.hora}</div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 flex flex-wrap gap-2 border-b border-white/10 bg-white/[0.03]">
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="p-3">Hora</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Servicio</th>
                  <th className="p-3">Especialista</th>
                  <th className="p-3">Duración</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasDelDia.map((c) => {
                  const cl = getCliente(c.clienteId);
                  const s = getServicio(c.servicioId);
                  const e = getEspecialista(c.especialistaId);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer"
                      onClick={() => setDrawerCita(c)}
                    >
                      <td className="p-3 font-mono">{c.hora}</td>
                      <td className="p-3">{cl?.nombre}</td>
                      <td className="p-3">{s?.nombre}</td>
                      <td className="p-3">{e?.nombre}</td>
                      <td className="p-3">{c.duracion} min</td>
                      <td className="p-3">${c.precio}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass(c.status)}`}>
                          {statusLabel(c.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {citasDelDia.length === 0 && (
              <p className="p-8 text-center text-slate-500">Sin citas este día</p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setModalOpen(false);
              setEditingId(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1624] shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(ev: MouseEvent) => ev.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">{editingId ? 'Reagendar cita' : 'Nueva cita'}</h2>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-white/10"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Buscar cliente</label>
                  <input
                    value={clienteQ}
                    onChange={(e) => setClienteQ(e.target.value)}
                    placeholder="Nombre, teléfono o email"
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, clienteId: c.id }));
                          setClienteQ(c.nombre);
                        }}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          form.clienteId === c.id ? 'border-fuchsia-500 text-fuchsia-200' : 'border-white/10 text-slate-400'
                        }`}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Servicio</label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {MOCK_SERVICIOS.filter((s) => s.disponible).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, servicioId: s.id }))}
                        className={`text-left rounded-xl border p-3 text-sm transition ${
                          form.servicioId === s.id ? 'border-fuchsia-500 bg-fuchsia-950/30' : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="text-lg mb-1">{s.emoji}</div>
                        <div className="font-medium">{s.nombre}</div>
                        <div className="text-xs text-slate-400">
                          ${s.precio} · {s.duracion} min
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Fecha</label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Hora</label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Especialista (disponible sin traslape)</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {especialistasFiltrados.length === 0 && (
                      <p className="text-xs text-amber-300">No hay especialistas libres en ese horario.</p>
                    )}
                    {especialistasFiltrados.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, especialistaId: e.id }))}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                          form.especialistaId === e.id ? 'border-violet-500 bg-violet-950/40' : 'border-white/10'
                        }`}
                      >
                        <span>{e.foto}</span> {e.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Notas</label>
                  <textarea
                    value={form.notas}
                    onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                    placeholder="Alergias, preferencias…"
                  />
                </div>

                <button
                  type="button"
                  onClick={confirmarCita}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: ACCENT }}
                >
                  Confirmar cita
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerCita && (
          <motion.div
            className="fixed inset-0 z-[55] flex justify-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerCita(null)}
          >
            <motion.aside
              className="w-full max-w-md h-full border-l border-white/10 bg-[#0c1220] shadow-2xl overflow-y-auto"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              onClick={(ev: MouseEvent) => ev.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">Detalle de cita</h2>
                <button type="button" className="p-2 rounded-lg hover:bg-white/10" onClick={() => setDrawerCita(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {(() => {
                  const c = drawerCita;
                  const cl = getCliente(c.clienteId);
                  const s = getServicio(c.servicioId);
                  const e = getEspecialista(c.especialistaId);
                  return (
                    <>
                      <p>
                        <span className="text-slate-500">Fecha y hora</span>
                        <br />
                        <span className="font-medium">
                          {c.fecha} · {c.hora}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">Cliente</span>
                        <br />
                        {cl?.nombre} — {cl?.telefono}
                      </p>
                      <p>
                        <span className="text-slate-500">Servicio</span>
                        <br />
                        {s?.nombre} ({c.duracion} min) — ${c.precio}
                      </p>
                      <p>
                        <span className="text-slate-500">Especialista</span>
                        <br />
                        {e?.nombre}
                      </p>
                      <p>
                        <span className="text-slate-500">Estado</span>
                        <br />
                        <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full border ${statusClass(c.status)}`}>
                          {statusLabel(c.status)}
                        </span>
                      </p>
                      {c.notas ? (
                        <p>
                          <span className="text-slate-500">Notas</span>
                          <br />
                          {c.notas}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 pt-4">
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          onClick={() => {
                            updateCita(c.id, { status: 'completada' });
                            setDrawerCita({ ...c, status: 'completada' });
                            setToast('Cita marcada como completada');
                          }}
                        >
                          Completar
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold"
                          onClick={() => {
                            updateCita(c.id, { status: 'cancelada' });
                            setDrawerCita({ ...c, status: 'cancelada' });
                            setToast('Cita cancelada');
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg border border-white/15 text-xs"
                          onClick={() => {
                            setEditingId(c.id);
                            setForm({
                              clienteId: c.clienteId,
                              servicioId: c.servicioId,
                              especialistaId: c.especialistaId,
                              fecha: c.fecha,
                              hora: c.hora,
                              notas: c.notas,
                            });
                            setClienteQ(getCliente(c.clienteId)?.nombre ?? '');
                            setDrawerCita(null);
                            setModalOpen(true);
                          }}
                        >
                          Reagendar
                        </button>
                        <Link
                          href={`/demo/spa/clientes?highlight=${c.clienteId}`}
                          className="px-3 py-2 rounded-lg text-xs border border-fuchsia-500/50 text-fuchsia-200"
                        >
                          Ver cliente
                        </Link>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-sm shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
