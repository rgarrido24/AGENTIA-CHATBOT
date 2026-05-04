'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLucianoPortalThemeOptional } from './LucianoPortalTheme';

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
  const themeCtx = useLucianoPortalThemeOptional();
  const light = themeCtx?.light ?? false;

  const emptyBg = light ? '#ffffff' : '#0d0d0d';
  const emptyBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const emptyText = light ? '#64748b' : '#444';
  const emptyHint = light ? '#94a3b8' : '#333';
  const rowBg = light ? '#ffffff' : '#0d0d0d';
  const rowBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const nameColor = light ? '#0f172a' : '#fff';
  const subColor = light ? '#64748b' : '#555';
  const metricColor = light ? '#0d9488' : '#22c55e';
  const totalColor = light ? '#94a3b8' : '#444';
  const activoBg = light ? '#ecfdf5' : '#0d2200';
  const activoColor = light ? '#047857' : '#22c55e';
  const suspendBg = light ? '#fef2f2' : '#1a0000';
  const suspendColor = light ? '#b91c1c' : '#ef4444';
  const delBtnBg = light ? '#fef2f2' : '#1a0000';
  const delBtnColor = light ? '#b91c1c' : '#ef4444';
  const delBtnBorder = light ? '#fecaca' : '#2a0000';

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
      <div className="rounded-xl p-8 text-center border shadow-sm" style={{ background: emptyBg, borderColor: emptyBorder }}>
        <p className="text-sm" style={{ color: emptyText }}>No tienes clientes aún.</p>
        <p className="text-xs mt-1" style={{ color: emptyHint }}>Usá el botón &quot;+ Agregar cliente&quot; para crear el primero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((c) => (
        <div
          key={c.clientSlug}
          className="flex items-center justify-between rounded-xl px-4 py-3 border shadow-sm"
          style={{ background: rowBg, borderColor: rowBorder }}
        >
          <Link href={`/portal/${resellerId}/cliente/${c.clientSlug}`} className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: nameColor }}>{c.nombre}</p>
            <p className="text-xs mt-0.5" style={{ color: subColor }}>{c.negocio}</p>
          </Link>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: metricColor }}>{c.leadsHoy} hoy</p>
              <p className="text-[10px]" style={{ color: totalColor }}>{c.total} total</p>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={c.status === 'activo'
                ? { background: activoBg, color: activoColor }
                : { background: suspendBg, color: suspendColor }}
            >
              {c.status}
            </span>
            <button
              onClick={() => handleDelete(c.clientSlug, c.nombre)}
              disabled={deleting === c.clientSlug}
              title="Eliminar cliente"
              className="rounded-lg px-2 py-1 text-xs transition disabled:opacity-40"
              style={{ background: delBtnBg, color: delBtnColor, border: `1px solid ${delBtnBorder}` }}
            >
              {deleting === c.clientSlug ? '…' : '✕'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
