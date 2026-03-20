'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Appointment = {
  id: string;
  clientId: string;
  slotStart: string;
  slotEnd: string;
  senderName?: string;
  senderId: string;
  platform: string;
  status: string;
  createdAt: string;
};

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (clientFilter) params.set('clientId', clientFilter);
    fetch(`/api/calendar/appointments?${params}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [clientFilter]);

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <main className="min-h-screen p-8 bg-luxury">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-slate-400 hover:text-emerald-400 mb-6 inline-block transition">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold mb-4 title-tracking text-white font-heading">
          Calendario Inteligente
        </h1>
        <p className="text-slate-400 mb-8 subtitle-tracking">
          Validación de disponibilidad, bloqueo automático en MongoDB, Google Calendar y recordatorios por WhatsApp.
        </p>

        <div className="card-glass p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Citas confirmadas</h2>
          <div className="mb-4">
            <label className="text-sm text-slate-400 mr-2">Filtrar por cliente:</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="rounded border border-white/10 bg-slate-900/60 backdrop-blur-xl px-3 py-2 text-sm text-white"
            >
              <option value="">Todos</option>
              <option value="izzi">izzi</option>
              <option value="demo-inmobiliaria">Inmobiliaria</option>
              <option value="agentia">Agentia</option>
            </select>
          </div>
          {loading ? (
            <p className="text-slate-400">Cargando...</p>
          ) : appointments.length === 0 ? (
            <p className="text-slate-400">No hay citas confirmadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">Asistente</th>
                    <th className="py-2 pr-4">Inicio</th>
                    <th className="py-2 pr-4">Fin</th>
                    <th className="py-2 pr-4">Plataforma</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-b border-white/10">
                      <td className="py-2 pr-4">{a.clientId}</td>
                      <td className="py-2 pr-4">{a.senderName || a.senderId || '-'}</td>
                      <td className="py-2 pr-4">{formatDate(a.slotStart)}</td>
                      <td className="py-2 pr-4">{formatDate(a.slotEnd)}</td>
                      <td className="py-2 pr-4">{a.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-glass p-6 space-y-4">
          <h2 className="text-lg font-semibold">Flujo implementado</h2>
          <ul className="list-disc list-inside text-sm space-y-2 text-slate-400">
            <li><strong>Validación:</strong> Antes de confirmar, se verifica que el slot no esté ocupado.</li>
            <li><strong>Bloqueo:</strong> Al confirmar por WhatsApp/Web, se crea en MongoDB y Google Calendar.</li>
            <li><strong>Cancelar:</strong> Escribir &quot;cancelar&quot; o abrir link de cancelación libera el slot.</li>
            <li><strong>Recordatorios:</strong> Cron cada 15 min encola recordatorios 2h antes; el WhatsApp Bridge los envía.</li>
          </ul>
          <p className="text-xs text-slate-400 mt-4">
            Configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y refresh token en calendar_tokens (MongoDB) o en .env.
          </p>
        </div>
      </div>
    </main>
  );
}
