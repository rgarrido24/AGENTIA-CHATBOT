'use client';

import { useMemo, useState } from 'react';
import {
  FECHA_REF_GROOMING,
  addDays,
  formatISODate,
  getDueño,
  getMascota,
  getServicioG,
  mensajeBañoMensual,
  mascotasNecesitanBañoMensual,
  parseISODate,
} from '@/lib/mock-data-grooming';
import { useGrooming } from '../grooming-context';

const ACCENT = '#f97316';

const MOCK_DUEÑOS_REACTIVA = [
  { id: 'd2', nombre: 'Carlos Vega', telefono: '555-1001-2001' },
  { id: 'd7', nombre: 'Jorge Sánchez', telefono: '555-1006-2006' },
  { id: 'd11', nombre: 'Gabriela Ríos', telefono: '555-1010-2010' },
];

type Tab = 'confirmacion' | 'baño' | 'reactivacion';

export default function GroomingRecordatoriosPage() {
  const [tab, setTab] = useState<Tab>('confirmacion');
  const { citas } = useGrooming();

  const confirmaciones = useMemo(() => {
    const fin = formatISODate(addDays(parseISODate(FECHA_REF_GROOMING), 7));
    return citas
      .filter((c) => c.fecha >= FECHA_REF_GROOMING && c.fecha <= fin && c.status === 'confirmada')
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }, [citas]);

  const bañoMensual = useMemo(() => mascotasNecesitanBañoMensual(), []);

  const reactivacion = MOCK_DUEÑOS_REACTIVA.map((d) => ({
    ...d,
    msg: `Hola ${d.nombre}, hace tiempo no vemos a tus peludos 🐶 ¿Te gustaría agendar con 15% en spa esta semana?`,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ['confirmacion', 'Confirmación cita'],
            ['baño', 'Recordatorio baño mensual'],
            ['reactivacion', 'Reactivación'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === k ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
            style={tab === k ? { background: ACCENT } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'confirmacion' && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.03] text-sm font-medium">Citas confirmadas (próximos 7 días)</div>
          <ul className="divide-y divide-white/5">
            {confirmaciones.map((c) => {
              const m = getMascota(c.mascotaId);
              const du = getDueño(c.dueñoId);
              const s = getServicioG(c.servicioId);
              return (
                <li key={c.id} className="px-4 py-3 text-sm">
                  <p className="text-orange-200 font-medium">
                    {m?.foto} {m?.nombre} — {c.fecha} {c.hora}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {du?.nombre} · {du?.telefono} · {s?.nombre}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 italic">
                    &quot;Hola {du?.nombre}, confirmamos el grooming de {m?.nombre} el {c.fecha} a las {c.hora}. ¿Todo
                    correcto? 🐾&quot;
                  </p>
                </li>
              );
            })}
          </ul>
          {confirmaciones.length === 0 && <p className="p-8 text-center text-slate-500">Sin confirmaciones en ventana.</p>}
        </div>
      )}

      {tab === 'baño' && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Mascotas con último grooming hace más de 28 días (referencia: {FECHA_REF_GROOMING}).
          </p>
          {bañoMensual.map((m) => {
            const du = getDueño(m.dueñoId);
            if (!du) return null;
            const msg = mensajeBañoMensual(m, du);
            return (
              <div key={m.id} className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{m.foto}</span>
                  <span className="font-medium">{m.nombre}</span>
                  <span className="text-xs text-slate-500">Último: {m.ultimoGrooming}</span>
                </div>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{msg}</pre>
              </div>
            );
          })}
          {bañoMensual.length === 0 && <p className="text-slate-500">Ninguna mascota supera los 28 días en el mock.</p>}
        </div>
      )}

      {tab === 'reactivacion' && (
        <div className="space-y-3">
          {reactivacion.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
              <p className="font-medium text-white">{r.nombre}</p>
              <p className="text-xs text-slate-500">{r.telefono}</p>
              <p className="text-sm text-slate-400 mt-2">{r.msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
