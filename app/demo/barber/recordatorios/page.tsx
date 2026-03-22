'use client';

import { useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';

type Tab = 'manana' | 'pasado' | 'reactivar';

const MANANA = [
  { nombre: 'Carlos Mendoza', fecha: '24 de marzo', hora: '10:00' },
  { nombre: 'Eduardo Vargas', fecha: '24 de marzo', hora: '09:30' },
  { nombre: 'Juan García', fecha: '24 de marzo', hora: '11:00' },
];

const PASADO_MANANA = [
  { nombre: 'Luis Ramírez', fecha: '25 de marzo', hora: '10:00' },
  { nombre: 'Sergio Reyes', fecha: '25 de marzo', hora: '12:00' },
];

const INACTIVOS = [
  'Fernando Castro',
  'Antonio Flores',
  'Miguel Torres',
];

function waUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function BarberRecordatoriosPage() {
  const [tab, setTab] = useState<Tab>('manana');

  const labels = useMemo(
    () =>
      ({
        manana: 'Confirmación (cita mañana)',
        pasado: 'Recordatorio 24h (pasado mañana)',
        reactivar: 'Reactivación clientes',
      }) as const,
    []
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <p className="text-slate-500 text-sm">Plantillas listas para WhatsApp — demo sin envío automático.</p>

      <div className="flex flex-wrap gap-2">
        {(['manana', 'pasado', 'reactivar'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              tab === t
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            {labels[t]}
          </button>
        ))}
      </div>

      {tab === 'manana' && (
        <ul className="space-y-3">
          {MANANA.map((c) => {
            const msg = `Hola ${c.nombre} ✂️ Tu cita en Barbería El Estilo es mañana ${c.fecha} a las ${c.hora}. ¿Necesitas cambiar algo? ¡Te esperamos!`;
            return (
              <li
                key={c.nombre}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{c.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {c.fecha} · {c.hora}
                  </p>
                </div>
                <a
                  href={waUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/50"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'pasado' && (
        <ul className="space-y-3">
          {PASADO_MANANA.map((c) => {
            const msg = `Hola ${c.nombre} ✂️ Te recordamos tu cita en Barbería El Estilo para ${c.fecha} a las ${c.hora}. ¿Confirmas asistencia?`;
            return (
              <li
                key={c.nombre}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{c.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {c.fecha} · {c.hora}
                  </p>
                </div>
                <a
                  href={waUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/50"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'reactivar' && (
        <ul className="space-y-3">
          {INACTIVOS.map((nombre) => {
            const msg = `Hola ${nombre}! Te extrañamos en Barbería El Estilo ✂️ Esta semana tenemos un 20% de descuento especial para clientes frecuentes. ¿Agendamos?`;
            return (
              <li
                key={nombre}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{nombre}</p>
                  <p className="text-xs text-slate-500">Sin visita +30 días (demo)</p>
                </div>
                <a
                  href={waUrl(msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/50"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
