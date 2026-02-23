'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { BusinessSchedule, DaySchedule, TimeRange } from '@/src/lib/business-settings';
import WhatsAppSimulator from '@/components/WhatsAppSimulator';

const DAY_LABELS: Record<string, string> = {
  lun: 'Lunes',
  mar: 'Martes',
  mie: 'Miércoles',
  jue: 'Jueves',
  vie: 'Viernes',
  sab: 'Sábado',
  dom: 'Domingo',
};

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
];

const BREAK_OPTIONS = [
  { value: 0, label: 'Sin descanso' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
];

export default function SettingsPage() {
  const [clientId, setClientId] = useState('izzi');
  const [schedule, setSchedule] = useState<BusinessSchedule | null>(null);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [breakBetweenMinutes, setBreakBetweenMinutes] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultSchedule: BusinessSchedule = {
    dom: { enabled: false, ranges: [{ start: '09:00', end: '18:00' }] },
    lun: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
    mar: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
    mie: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
    jue: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
    vie: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
    sab: { enabled: false, ranges: [{ start: '09:00', end: '14:00' }] },
  };

  useEffect(() => {
    fetch(`/api/business-settings?clientId=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((d) => {
        setSchedule(d.schedule ?? defaultSchedule);
        if (d.slotDurationMinutes != null) setSlotDurationMinutes(d.slotDurationMinutes);
        if (d.breakBetweenMinutes != null) setBreakBetweenMinutes(d.breakBetweenMinutes);
      })
      .catch(() => setSchedule(defaultSchedule))
      .finally(() => setLoading(false));
  }, [clientId]);

  const updateDay = (day: keyof BusinessSchedule, upd: Partial<DaySchedule>) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], ...upd },
    });
  };

  const addRange = (day: keyof BusinessSchedule) => {
    if (!schedule) return;
    const ranges = [...(schedule[day]?.ranges ?? []), { start: '09:00', end: '18:00' }];
    updateDay(day, { ranges });
  };

  const updateRange = (day: keyof BusinessSchedule, idx: number, field: 'start' | 'end', value: string) => {
    if (!schedule) return;
    const ranges = [...(schedule[day]?.ranges ?? [])];
    if (ranges[idx]) ranges[idx] = { ...ranges[idx], [field]: value };
    updateDay(day, { ranges });
  };

  const removeRange = (day: keyof BusinessSchedule, idx: number) => {
    if (!schedule) return;
    const ranges = (schedule[day]?.ranges ?? []).filter((_, i) => i !== idx);
    updateDay(day, { ranges: ranges.length ? ranges : [{ start: '09:00', end: '18:00' }] });
  };

  const handleSave = () => {
    setSaving(true);
    fetch('/api/business-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        schedule,
        slotDurationMinutes,
        breakBetweenMinutes,
      }),
    })
      .then((r) => r.json())
      .then(() => {})
      .finally(() => setSaving(false));
  };

  if (loading || !schedule) {
    return (
      <main className="min-h-screen p-8 bg-[#0a1209]">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-[#0a1209]">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-slate-400 hover:text-emerald-400 mb-6 inline-block transition">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold mb-2 title-tracking text-white font-heading">
          Configuración de Negocio
        </h1>
        <p className="text-muted-foreground mb-8 subtitle-tracking">
          Configura horarios, duración de citas y margen de seguridad para la marca blanca.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Cliente</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-2 text-white"
          >
            <option value="izzi">izzi</option>
            <option value="demo-inmobiliaria">Inmobiliaria</option>
            <option value="agentia">Agentia</option>
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <div className="card-glass p-6">
          <h2 className="text-lg font-semibold mb-4 title-tracking text-white font-heading">
              Duración del Servicio
            </h2>
            <select
              value={slotDurationMinutes}
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-2 text-white"
            >
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="card-glass p-6">
          <h2 className="text-lg font-semibold mb-4 title-tracking text-white font-heading">
              Margen de Seguridad (descanso entre citas)
            </h2>
            <select
              value={breakBetweenMinutes}
              onChange={(e) => setBreakBetweenMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-2 text-white"
            >
              {BREAK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-glass p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 title-tracking" className="text-white font-heading">
            Horarios por día
          </h2>
          <div className="space-y-4">
            {(Object.keys(schedule) as (keyof BusinessSchedule)[]).map((day) => (
              <div key={day} className="flex flex-wrap items-center gap-4 py-2 border-b border-white/10 last:border-0">
                <label className="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    checked={schedule[day]?.enabled ?? false}
                    onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                    className="rounded"
                  />
                  <span>{DAY_LABELS[day] ?? day}</span>
                </label>
                <div className="flex flex-wrap gap-2 flex-1">
                  {(schedule[day]?.ranges ?? []).map((r: TimeRange, idx: number) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={r.start}
                        onChange={(e) => updateRange(day, idx, 'start', e.target.value)}
                        className="rounded border border-white/10 bg-slate-900/60 backdrop-blur-xl px-2 py-1 text-sm text-white"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="time"
                        value={r.end}
                        onChange={(e) => updateRange(day, idx, 'end', e.target.value)}
                        className="rounded border border-white/10 bg-slate-900/60 backdrop-blur-xl px-2 py-1 text-sm text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(day, idx)}
                        className="text-red-400 hover:text-red-300 text-xs px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRange(day)}
                    className="text-sm px-2 py-1 rounded border border-white/10 hover:border-emerald-500/50 transition text-white"
                  >
                    + Rango
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-cta mb-12"
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>

        <WhatsAppSimulator clientId={clientId} />
      </div>
    </main>
  );
}
