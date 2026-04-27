'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ClientItem = {
  clientSlug: string;
  nombre:     string;
  negocio:    string;
  status:     string;
  leadsHoy:   number;
  total:      number;
};

export default function ClientsList({ resellerId, clients }: { resellerId: string; clients: ClientItem[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(clientSlug: string, nombre: string) {
    if (!confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(clientSlug);
    try {
      const res = await fetch(`/api/portal/${resellerId}/client/${clientSlug}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Error al eliminar');
        return;
      }
      router.refresh();
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(null);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center border" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
        <p className="text-sm" style={{ color: '#444' }}>No tienes clientes aún.</p>
        <p className="text-xs mt-1" style={{ color: '#333' }}>Usá el botón &quot;+ Agregar cliente&quot; para crear el primero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((c) => (
        <div
          key={c.clientSlug}
          className="flex items-center justify-between rounded-xl px-4 py-3 border"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <Link href={`/portal/${resellerId}/cliente/${c.clientSlug}`} className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{c.nombre}</p>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>{c.negocio}</p>
          </Link>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: '#22c55e' }}>{c.leadsHoy} hoy</p>
              <p className="text-[10px]" style={{ color: '#444' }}>{c.total} total</p>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={c.status === 'activo'
                ? { background: '#0d2200', color: '#22c55e' }
                : { background: '#1a0000', color: '#ef4444' }}
            >
              {c.status}
            </span>
            <button
              onClick={() => handleDelete(c.clientSlug, c.nombre)}
              disabled={deleting === c.clientSlug}
              title="Eliminar cliente"
              className="rounded-lg px-2 py-1 text-xs transition disabled:opacity-40"
              style={{ background: '#1a0000', color: '#ef4444', border: '1px solid #2a0000' }}
            >
              {deleting === c.clientSlug ? '…' : '✕'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
