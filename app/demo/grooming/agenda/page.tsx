'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  FECHA_REF_GROOMING,
  addDays,
  duracionServicio,
  formatISODate,
  getDueño,
  getGroomer,
  getMascota,
  getServicioG,
  groomerPuedeEnHorario,
  hayTraslapeGroomer,
  horaAMinutos,
  HORAS_AGENDA,
  labelSemana,
  MOCK_DUEÑOS,
  MOCK_GROOMERS,
  MOCK_MASCOTAS,
  MOCK_SERVICIOS,
  parseISODate,
  precioTotalCita,
  startOfWeekMonday,
  type CitaGrooming,
} from '@/lib/mock-data-grooming';
import { useGrooming } from '../grooming-context';

const ACCENT = '#f97316';

const GR_COLOR: Record<string, string> = {
  gr1: 'bg-orange-600 border-orange-400',
  gr2: 'bg-amber-600 border-amber-400',
  gr3: 'bg-yellow-700 border-yellow-500',
};

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function statusLabel(s: CitaGrooming['status']) {
  const m: Record<CitaGrooming['status'], string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_camino: 'En camino',
    atendiendo: 'Atendiendo',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  return m[s];
}

function statusClass(s: CitaGrooming['status']) {
  const m: Record<CitaGrooming['status'], string> = {
    pendiente: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    confirmada: 'bg-orange-500/25 text-orange-200 border-orange-500/40',
    en_camino: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    atendiendo: 'bg-violet-500/25 text-violet-200 border-violet-500/40',
    completada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    cancelada: 'bg-slate-600/40 text-slate-400 border-slate-500/40',
  };
  return m[s];
}

const MIN_DIA = 8 * 60;
const PX_POR_MIN = 1.2;
const ALTURA_DIA = (20 - 8) * 60 * PX_POR_MIN;
const ROW_H = ALTURA_DIA / 12;

export default function GroomingAgendaPage() {
  const { citas, addCita, updateCita, serviciosOn } = useGrooming();
  const [selectedDay, setSelectedDay] = useState(FECHA_REF_GROOMING);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(parseISODate(FECHA_REF_GROOMING)));
  const [view, setView] = useState<'week' | 'day' | 'list'>('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerCita, setDrawerCita] = useState<CitaGrooming | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dueñoQ, setDueñoQ] = useState('');
  const [form, setForm] = useState({
    dueñoId: '',
    mascotaId: '',
    servicioId: '',
    groomerId: '',
    modalidad: 'sucursal' as 'sucursal' | 'domicilio',
    fecha: FECHA_REF_GROOMING,
    hora: '10:00',
    direccion: '',
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
  const mascotaSel = getMascota(form.mascotaId);
  const startMinForm = horaAMinutos(form.hora);

  const precioPreview = useMemo(() => {
    if (!servicioSel || !mascotaSel) return 0;
    return precioTotalCita(servicioSel, mascotaSel.tamaño, form.modalidad);
  }, [servicioSel, mascotaSel, form.modalidad]);

  const durPreview = useMemo(() => {
    if (!servicioSel || !mascotaSel) return 0;
    return duracionServicio(servicioSel, mascotaSel.tamaño);
  }, [servicioSel, mascotaSel]);

  const groomersFiltrados = useMemo(() => {
    if (!servicioSel || !mascotaSel) return MOCK_GROOMERS;
    const dur = duracionServicio(servicioSel, mascotaSel.tamaño);
    return MOCK_GROOMERS.filter((g) => {
      if (!groomerPuedeEnHorario(g, startMinForm, dur)) return false;
      if (hayTraslapeGroomer(citas, g.id, form.fecha, startMinForm, dur, editingId ?? undefined)) return false;
      return true;
    });
  }, [servicioSel, mascotaSel, startMinForm, form.fecha, citas, editingId]);

  const dueñosFiltrados = useMemo(() => {
    const q = dueñoQ.trim().toLowerCase();
    if (!q) return MOCK_DUEÑOS.slice(0, 8);
    return MOCK_DUEÑOS.filter(
      (d) => d.nombre.toLowerCase().includes(q) || d.telefono.includes(q) || d.email.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [dueñoQ]);

  const mascotasDelDueño = useMemo(() => {
    if (!form.dueñoId) return [];
    return MOCK_MASCOTAS.filter((m) => m.dueñoId === form.dueñoId);
  }, [form.dueñoId]);

  const confirmarCita = () => {
    if (!form.dueñoId || !form.mascotaId || !form.servicioId || !form.groomerId || !servicioSel || !mascotaSel) {
      setToast('Completa dueño, mascota, servicio y groomer');
      return;
    }
    if (!serviciosOn[form.servicioId]) {
      setToast('Ese servicio está desactivado');
      return;
    }
    const dur = duracionServicio(servicioSel, mascotaSel.tamaño);
    if (hayTraslapeGroomer(citas, form.groomerId, form.fecha, startMinForm, dur, editingId ?? undefined)) {
      setToast('Hay traslape con otra cita');
      return;
    }
    const gr = getGroomer(form.groomerId);
    if (!gr || !groomerPuedeEnHorario(gr, startMinForm, dur)) {
      setToast('Groomer no disponible en ese horario');
      return;
    }
    if (form.modalidad === 'domicilio' && !form.direccion.trim()) {
      setToast('Indica dirección para domicilio');
      return;
    }
    const precio = precioTotalCita(servicioSel, mascotaSel.tamaño, form.modalidad);
    if (editingId) {
      updateCita(editingId, {
        dueñoId: form.dueñoId,
        mascotaId: form.mascotaId,
        servicioId: form.servicioId,
        groomerId: form.groomerId,
        fecha: form.fecha,
        hora: form.hora,
        duracion: dur,
        precio,
        modalidad: form.modalidad,
        direccion: form.modalidad === 'domicilio' ? form.direccion.trim() : undefined,
        notas: form.notas.trim(),
        status: 'confirmada',
      });
      setToast('Cita actualizada ✅');
    } else {
      const nueva: CitaGrooming = {
        id: `cg-${Date.now()}`,
        dueñoId: form.dueñoId,
        mascotaId: form.mascotaId,
        servicioId: form.servicioId,
        groomerId: form.groomerId,
        fecha: form.fecha,
        hora: form.hora,
        duracion: dur,
        precio,
        modalidad: form.modalidad,
        direccion: form.modalidad === 'domicilio' ? form.direccion.trim() : undefined,
        notas: form.notas.trim(),
        status: 'confirmada',
      };
      addCita(nueva);
      setToast('Cita agendada ✅');
    }
    setModalOpen(false);
    setForm((f) => ({ ...f, notas: '', direccion: '' }));
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
          <button type="button" onClick={prevWeek} className="p-2 rounded-lg border border-white/10 hover:bg-white/5" aria-label="Semana anterior">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03]">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">Semana del {labelSemana(weekStart)}</span>
          </div>
          <button type="button" onClick={nextWeek} className="p-2 rounded-lg border border-white/10 hover:bg-white/5" aria-label="Semana siguiente">
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
              setDueñoQ('');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: ACCENT }}
          >
            <Plus className="w-4 h-4" />
            Nueva cita
          </button>
        </div>
      </div>

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
                    className={`text-center py-2 text-xs rounded-t-lg ${active ? 'bg-orange-600/30' : 'hover:bg-white/5'}`}
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
                    const s = getServicioG(c.servicioId);
                    const m = getMascota(c.mascotaId);
                    const top = (horaAMinutos(c.hora) - MIN_DIA) * PX_POR_MIN;
                    const hgt = c.duracion * PX_POR_MIN;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDrawerCita(c)}
                        className={`absolute left-0.5 right-0.5 rounded border text-left px-1 py-0.5 text-[10px] leading-tight text-white shadow ${GR_COLOR[c.groomerId] ?? 'bg-slate-600'}`}
                        style={{ top, height: Math.max(hgt, 28), zIndex: 2 }}
                      >
                        <span className="mr-0.5">{m?.foto}</span>
                        <span className="font-semibold truncate">{m?.nombre}</span>
                        <div className="opacity-90 truncate">{s?.nombre}</div>
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
          <input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <div className="flex gap-2 min-w-[720px]">
            <div className="flex flex-col shrink-0 w-12" style={{ height: ALTURA_DIA }}>
              {HORAS_AGENDA.map((h) => (
                <div key={h} className="text-[10px] text-slate-500 text-right pr-1 border-b border-white/5" style={{ height: ROW_H }}>
                  {h}:00
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1">
              {MOCK_GROOMERS.map((e) => (
                <div key={e.id} className="min-w-[120px]">
                  <div className="text-center text-xs font-medium text-orange-200/90 pb-2 border-b border-white/10 mb-1">
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
                      .filter((c) => c.fecha === selectedDay && c.groomerId === e.id && c.status !== 'cancelada')
                      .map((c) => {
                        const s = getServicioG(c.servicioId);
                        const m = getMascota(c.mascotaId);
                        const top = (horaAMinutos(c.hora) - MIN_DIA) * PX_POR_MIN;
                        const blk = c.duracion * PX_POR_MIN;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setDrawerCita(c)}
                            className={`absolute left-0.5 right-0.5 rounded border px-1 py-1 text-left text-[10px] text-white ${GR_COLOR[e.id]}`}
                            style={{ top, height: Math.max(blk, 32), zIndex: 2 }}
                          >
                            <span className="text-sm mr-0.5">{m?.foto}</span>
                            <div className="font-semibold truncate">{m?.nombre}</div>
                            <div className="opacity-90 truncate">{s?.nombre}</div>
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
          <div className="p-3 border-b border-white/10 bg-white/[0.03]">
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
                  <th className="p-3">Mascota</th>
                  <th className="p-3">Servicio</th>
                  <th className="p-3">Groomer</th>
                  <th className="p-3">Modalidad</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasDelDia.map((c) => {
                  const m = getMascota(c.mascotaId);
                  const s = getServicioG(c.servicioId);
                  const g = getGroomer(c.groomerId);
                  return (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer" onClick={() => setDrawerCita(c)}>
                      <td className="p-3 font-mono">{c.hora}</td>
                      <td className="p-3">
                        <span className="mr-1">{m?.foto}</span>
                        {m?.nombre}
                      </td>
                      <td className="p-3">{s?.nombre}</td>
                      <td className="p-3">{g?.nombre}</td>
                      <td className="p-3">{c.modalidad === 'domicilio' ? '🚐' : '🏪'}</td>
                      <td className="p-3">${c.precio}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass(c.status)}`}>{statusLabel(c.status)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {citasDelDia.length === 0 && <p className="p-8 text-center text-slate-500">Sin citas este día</p>}
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
                  <label className="text-xs text-slate-400">Dueño</label>
                  <input
                    value={dueñoQ}
                    onChange={(e) => setDueñoQ(e.target.value)}
                    placeholder="Buscar dueño"
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {dueñosFiltrados.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, dueñoId: d.id, mascotaId: '' }));
                          setDueñoQ(d.nombre);
                        }}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          form.dueñoId === d.id ? 'border-orange-500 text-orange-200' : 'border-white/10 text-slate-400'
                        }`}
                      >
                        {d.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Mascota</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mascotasDelDueño.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, mascotaId: m.id }))}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm ${
                          form.mascotaId === m.id ? 'border-orange-500 bg-orange-950/30' : 'border-white/10'
                        }`}
                      >
                        <span>{m.foto}</span> {m.nombre}
                      </button>
                    ))}
                    {form.dueñoId && mascotasDelDueño.length === 0 && (
                      <p className="text-xs text-amber-400">Sin mascotas para este dueño</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Modalidad</label>
                  <div className="flex gap-2 mt-2">
                    {(['sucursal', 'domicilio'] as const).map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, modalidad: mod }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          form.modalidad === mod ? 'border-orange-500 text-orange-200' : 'border-white/10 text-slate-400'
                        }`}
                      >
                        {mod === 'sucursal' ? '🏪 Sucursal' : '🚐 Domicilio'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.modalidad === 'domicilio' && (
                  <div>
                    <label className="text-xs text-slate-400">Dirección</label>
                    <input
                      value={form.direccion}
                      onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
                      placeholder="Calle, número, colonia…"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400">Servicio</label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {MOCK_SERVICIOS.filter((s) => serviciosOn[s.id]).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, servicioId: s.id }))}
                        className={`text-left rounded-xl border p-3 text-sm transition flex gap-2 items-center ${
                          form.servicioId === s.id ? 'border-orange-500 bg-orange-950/30' : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.imagen} alt={s.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{s.nombre}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {mascotaSel && servicioSel && (
                  <p className="text-sm text-orange-200">
                    Precio estimado: <strong>${precioPreview}</strong> · {durPreview} min ({mascotaSel.tamaño})
                  </p>
                )}

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
                  <label className="text-xs text-slate-400">Groomer</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {groomersFiltrados.length === 0 && <p className="text-xs text-amber-300">Sin groomers libres.</p>}
                    {groomersFiltrados.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, groomerId: g.id }))}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                          form.groomerId === g.id ? 'border-orange-500 bg-orange-950/40' : 'border-white/10'
                        }`}
                      >
                        <span>{g.foto}</span> {g.nombre}
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
                  />
                </div>

                <button type="button" onClick={confirmarCita} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: ACCENT }}>
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
                  const du = getDueño(c.dueñoId);
                  const mas = getMascota(c.mascotaId);
                  const s = getServicioG(c.servicioId);
                  const g = getGroomer(c.groomerId);
                  const prox = citas
                    .filter((x) => x.mascotaId === mas?.id && x.fecha >= FECHA_REF_GROOMING && x.status !== 'cancelada' && x.status !== 'completada')
                    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
                  return (
                    <>
                      <div className="rounded-xl border border-white/10 p-3 bg-white/[0.04]">
                        <p className="text-xs text-slate-500 mb-1">Mascota</p>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{mas?.foto}</span>
                          <div>
                            <p className="font-semibold">{mas?.nombre}</p>
                            <p className="text-xs text-slate-400">
                              {mas?.raza} · {mas?.tamaño}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs mt-2">
                          <span className="text-slate-500">Comportamiento:</span>{' '}
                          <span className="text-orange-200">{mas?.comportamiento}</span>
                        </p>
                        <p className="text-xs mt-1">
                          <span className="text-slate-500">Alergias:</span> {mas?.alergias}
                        </p>
                        <p className="text-xs mt-1 text-slate-400">{mas?.notasEspeciales}</p>
                      </div>
                      <p>
                        <span className="text-slate-500">Fecha y hora</span>
                        <br />
                        <span className="font-medium">
                          {c.fecha} · {c.hora}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">Dueño</span>
                        <br />
                        {du?.nombre} — {du?.telefono}
                      </p>
                      <p>
                        <span className="text-slate-500">Servicio</span>
                        <br />
                        {s?.nombre} ({c.duracion} min) — ${c.precio}
                      </p>
                      <p>
                        <span className="text-slate-500">Modalidad</span>
                        <br />
                        {c.modalidad === 'domicilio' ? `🚐 Domicilio — ${c.direccion ?? ''}` : '🏪 Sucursal'}
                      </p>
                      <p>
                        <span className="text-slate-500">Groomer</span>
                        <br />
                        {g?.nombre}
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
                          <span className="text-slate-500">Notas cita</span>
                          <br />
                          {c.notas}
                        </p>
                      ) : null}
                      {prox && (
                        <p className="text-xs text-slate-400">
                          Próxima cita: {prox.fecha} {prox.hora}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-4">
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          onClick={() => {
                            updateCita(c.id, { status: 'completada' });
                            setDrawerCita({ ...c, status: 'completada' });
                            setToast('Completada');
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
                            setToast('Cancelada');
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
                              dueñoId: c.dueñoId,
                              mascotaId: c.mascotaId,
                              servicioId: c.servicioId,
                              groomerId: c.groomerId,
                              modalidad: c.modalidad,
                              fecha: c.fecha,
                              hora: c.hora,
                              direccion: c.direccion ?? '',
                              notas: c.notas,
                            });
                            setDueñoQ(getDueño(c.dueñoId)?.nombre ?? '');
                            setDrawerCita(null);
                            setModalOpen(true);
                          }}
                        >
                          Reagendar
                        </button>
                        <Link
                          href={`/demo/grooming/mascotas/${c.mascotaId}`}
                          className="px-3 py-2 rounded-lg text-xs border border-orange-500/50 text-orange-200"
                        >
                          Ficha mascota
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
