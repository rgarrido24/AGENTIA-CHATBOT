'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Contact = {
  _id?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  origen?: string;
  estado?: string;
  fecha?: string;
};

export default function AdminDashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/contacts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.contacts)) setContacts(data.contacts);
        else setError(data?.error || 'Error al cargar');
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, []);

  const toggleKillSwitch = () => {
    if (confirm('¿Activar Kill-Switch? Esto deshabilitará el bot/API para todos los usuarios.')) {
      setKillSwitchActive((v) => !v);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-['Inter',sans-serif]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-slate-400 hover:text-emerald-400 transition"
            >
              Panel
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm text-slate-400 hover:text-emerald-400 transition"
            >
              Configuración
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-white/90 font-semibold">Panel de control</span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-slate-400 hover:text-red-400 transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h1 className="text-xl font-bold text-white/95 mb-4">Tabla de prospección</h1>
          <p className="text-sm text-slate-400 mb-4">
            Contactos desde MongoDB. Solo visible para administradores autenticados.
          </p>
          {loading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : error ? (
            <p className="text-amber-400">{error}</p>
          ) : contacts.length === 0 ? (
            <p className="text-slate-500">
              No hay contactos aún. Configura MONGODB_URI en las variables de entorno para conectar
              la base de datos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Nombre</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Teléfono</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Origen</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Estado</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={c._id || i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 px-2">{c.nombre ?? '-'}</td>
                      <td className="py-2 px-2">{c.email ?? '-'}</td>
                      <td className="py-2 px-2">{c.telefono ?? '-'}</td>
                      <td className="py-2 px-2">{c.origen ?? '-'}</td>
                      <td className="py-2 px-2">{c.estado ?? '-'}</td>
                      <td className="py-2 px-2">{c.fecha ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {contacts.length > 0 && (
            <p className="text-xs text-slate-500 mt-4">Total: {contacts.length} contactos</p>
          )}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 className="text-lg font-bold text-white/95 mb-2">Kill-Switch</h2>
          <p className="text-sm text-slate-400 mb-4">
            Desactiva de emergencia el chatbot o la API para todos los usuarios.
          </p>
          <button
            type="button"
            onClick={toggleKillSwitch}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              killSwitchActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {killSwitchActive ? 'KILL-SWITCH ACTIVADO' : 'Activar Kill-Switch'}
          </button>
          {killSwitchActive && (
            <p className="text-amber-400 text-sm mt-2">
              En producción aquí se persistiría el estado (env o DB) para deshabilitar el servicio.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
