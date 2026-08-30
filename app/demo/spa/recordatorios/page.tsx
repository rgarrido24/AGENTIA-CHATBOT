'use client';

import { Bell, MessageSquare, Smartphone } from 'lucide-react';
import { useMemo } from 'react';
import {
  FECHA_REF_DASHBOARD,
  addDays,
  formatISODate,
  getCliente,
  getServicio,
  parseISODate,
} from '@/lib/mock-data-spa';
import { useSpa } from '../spa-context';

export default function SpaRecordatoriosPage() {
  const { citas } = useSpa();

  const upcoming = useMemo(() => {
    const fin = formatISODate(addDays(parseISODate(FECHA_REF_DASHBOARD), 7));
    return citas
      .filter(
        (c) => c.fecha >= FECHA_REF_DASHBOARD && c.fecha <= fin && c.status !== 'cancelada' && c.status !== 'completada'
      )
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
      .slice(0, 12);
  }, [citas]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <p className="text-slate-500 text-sm">
        Recordatorios automáticos (SMS / WhatsApp) para citas próximas — demo sin envío real.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Smartphone, title: 'SMS', desc: '24 h y 2 h antes', color: 'text-violet-300' },
          { icon: MessageSquare, title: 'WhatsApp', desc: 'Confirmación y reseña', color: 'text-fuchsia-300' },
          { icon: Bell, title: 'Push recepción', desc: 'Alertas de llegada', color: 'text-pink-300' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Icon className={`w-8 h-8 mb-2 ${color}`} />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] font-medium">Cola de envíos (próximos 7 días)</div>
        <ul className="divide-y divide-white/5">
          {upcoming.map((c) => {
            const cl = getCliente(c.clienteId);
            const sv = getServicio(c.servicioId);
            return (
              <li key={c.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="text-fuchsia-300 font-medium">{cl?.nombre}</span>
                  <span className="text-slate-500"> · </span>
                  <span className="text-slate-400">
                    {c.fecha} {c.hora}
                  </span>
                </div>
                <div className="text-slate-400 text-xs">
                  {sv?.nombre} — recordatorio <span className="text-violet-300">programado</span>
                </div>
              </li>
            );
          })}
        </ul>
        {upcoming.length === 0 && <p className="p-8 text-center text-slate-500">Sin citas pendientes en ventana.</p>}
      </div>
    </div>
  );
}
