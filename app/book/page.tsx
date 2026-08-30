'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getStoredConfig, getDefaultConfig, type DemoBusinessConfig } from '@/src/lib/demo-config';

type SlotRange = { start: string; end: string };

function toDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatSlotTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00Z');
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

const DAYS_AHEAD = 14;

export default function BookPage() {
  const [config, setConfig] = useState<DemoBusinessConfig>(getDefaultConfig());
  const [appointments, setAppointments] = useState<SlotRange[]>([]);
  const [step, setStep] = useState<'service' | 'date' | 'slot' | 'confirm' | 'done'>('service');
  const [service, setService] = useState<string>('');
  const [dateIso, setDateIso] = useState<string>('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredConfig();
    if (stored) setConfig(stored);
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/book/appointments');
      const data = await res.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch {
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const [dateList, setDateList] = useState<string[]>([]);
  useEffect(() => {
    const list: string[] = [];
    const start = new Date();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      list.push(toDateIso(d));
    }
    setDateList(list);
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!dateIso || !service) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/book/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateIso,
          serviceName: service,
          existingEvents: appointments,
          businessConfig: {
            capacidadSimultanea: config.capacidadSimultanea,
            services: config.services.map((s) => ({ name: s.name, duracionEstimada: s.duracionEstimada })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar horarios');
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar horarios');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [dateIso, service, appointments, config]);

  useEffect(() => {
    if (step === 'slot' && dateIso && service) fetchSlots();
  }, [step, dateIso, service, fetchSlots]);

  const handleReserve = async () => {
    if (!selectedSlot || !service) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/book/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: selectedSlot,
          serviceName: service,
          businessConfig: {
            capacidadSimultanea: config.capacidadSimultanea,
            services: config.services.map((s) => ({ name: s.name, duracionEstimada: s.duracionEstimada })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reservar');
      await fetchAppointments();
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('service');
    setService('');
    setDateIso('');
    setSlots([]);
    setSelectedSlot('');
    setClientName('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-['Inter',sans-serif]">
      <div className="max-w-lg mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/demo/barber"
            className="text-sm text-slate-400 hover:text-emerald-400 transition"
          >
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-white/95">Reservar cita</h1>
          <div className="w-14" />
        </div>

        <div
          className="rounded-2xl p-4 sm:p-6 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {step === 'service' && (
            <>
              <h2 className="text-base font-semibold text-slate-200">Elige un servicio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {config.services.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => { setService(s.name); setStep('date'); }}
                    className="px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-left hover:border-emerald-500/50 hover:bg-slate-700/50 transition"
                  >
                    <span className="font-medium text-white">{s.name}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">{s.price} MXN · {s.duracionEstimada ?? 30} min</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'date' && (
            <>
              <button type="button" onClick={() => setStep('service')} className="text-sm text-slate-400 hover:text-white">
                ← Cambiar servicio
              </button>
              <h2 className="text-base font-semibold text-slate-200">Elige un día</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dateList.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDateIso(d); setStep('slot'); }}
                    className="px-3 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-center hover:border-emerald-500/50 transition"
                  >
                    {formatDateLabel(d)}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'slot' && (
            <>
              <button type="button" onClick={() => setStep('date')} className="text-sm text-slate-400 hover:text-white">
                ← Cambiar día
              </button>
              <h2 className="text-base font-semibold text-slate-200">Horarios disponibles ({service})</h2>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {loading && <p className="text-sm text-slate-400">Cargando...</p>}
              {!loading && slots.length === 0 && !error && (
                <p className="text-sm text-slate-400">No hay horarios libres este día. Elige otro día.</p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { setSelectedSlot(slot); setStep('confirm'); }}
                    className="px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-sm hover:border-emerald-500/50 transition"
                  >
                    {formatSlotTime(slot)}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button type="button" onClick={() => setStep('slot')} className="text-sm text-slate-400 hover:text-white">
                ← Cambiar horario
              </button>
              <h2 className="text-base font-semibold text-slate-200">Confirmar reserva</h2>
              <p className="text-sm text-slate-400">
                {service} · {formatDateLabel(dateIso)} a las {selectedSlot ? formatSlotTime(selectedSlot) : ''}
              </p>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tu nombre</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('slot')}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {loading ? 'Reservando...' : 'Confirmar'}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <div className="text-center py-4">
                <p className="text-emerald-400 font-semibold text-lg">Reserva confirmada</p>
                <p className="text-slate-400 text-sm mt-2">
                  {service} · {selectedSlot ? formatSlotTime(selectedSlot) : ''} · {dateIso}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5"
                >
                  Nueva reserva
                </button>
                <Link
                  href="/demo/barber"
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-center"
                >
                  Ir al chat
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
