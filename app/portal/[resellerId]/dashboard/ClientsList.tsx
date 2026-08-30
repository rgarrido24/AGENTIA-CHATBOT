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
  alertNumber: string;
};

export default function ClientsList({ resellerId, clients }: { resellerId: string; clients: ClientItem[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [alertEdit, setAlertEdit] = useState<{ slug: string; nombre: string; value: string } | null>(null);
  const [savingAlert, setSavingAlert] = useState(false);
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

  async function saveAlertNumber() {
    if (!alertEdit) return;
    setSavingAlert(true);
    try {
      const res = await fetch(`/api/portal/${resellerId}/client/${alertEdit.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertNumber: alertEdit.value.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error || 'No se pudo guardar');
        return;
      }
      setAlertEdit(null);
      router.refresh();
    } catch {
      alert('Error de conexión');
    } finally {
      setSavingAlert(false);
    }
  }

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

  const modalBg = light ? '#ffffff' : '#141414';
  const modalBorder = light ? 'rgba(15,23,42,0.12)' : '#2a2a2a';
  const inputBg = light ? '#f8fafc' : '#0d0d0d';
  const btnPrimaryBg = light ? '#CCFF00' : '#22c55e';
  const btnPrimaryColor = light ? '#000' : '#fff';

  return (
    <div className="space-y-2">
      {alertEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-edit-title"
        >
          <div
            className="w-full max-w-sm rounded-xl border p-4 shadow-xl"
            style={{ background: modalBg, borderColor: modalBorder }}
          >
            <p id="alert-edit-title" className="text-sm font-bold" style={{ color: nameColor }}>
              WhatsApp — alertas de leads
            </p>
            <p className="text-xs mt-1" style={{ color: subColor }}>
              {alertEdit.nombre}
            </p>
            <input
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: inputBg, borderColor: modalBorder, color: nameColor }}
              placeholder="Ej. 54911..."
              value={alertEdit.value}
              onChange={(e) => setAlertEdit({ ...alertEdit, value: e.target.value })}
            />
            <p className="text-[10px] mt-2" style={{ color: subColor }}>
              Dejá vacío para usar solo la variable del servidor (FB_ALERT_NUMBER). Si cargás un número, las alertas de formularios de este cliente van a ese WhatsApp.
            </p>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-xs"
                style={{ background: light ? '#e2e8f0' : '#222', color: nameColor }}
                onClick={() => setAlertEdit(null)}
                disabled={savingAlert}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: btnPrimaryBg, color: btnPrimaryColor }}
                onClick={() => void saveAlertNumber()}
                disabled={savingAlert}
              >
                {savingAlert ? '…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {clients.map((c) => (
        <div
          key={c.clientSlug}
          className="flex items-center justify-between rounded-xl px-4 py-3 border shadow-sm"
          style={{ background: rowBg, borderColor: rowBorder }}
        >
          <Link href={`/portal/${resellerId}/cliente/${c.clientSlug}`} className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: nameColor }}>{c.nombre}</p>
            <p className="text-xs mt-0.5" style={{ color: subColor }}>{c.negocio}</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: totalColor }}>
              Alertas: {c.alertNumber ? c.alertNumber : '→ FB_ALERT_NUMBER'}
            </p>
          </Link>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: metricColor }}>{c.leadsHoy} hoy</p>
              <p className="text-[10px]" style={{ color: totalColor }}>{c.total} total</p>
            </div>
            <button
              type="button"
              title="Número WhatsApp para alertas de leads"
              className="rounded-lg px-2 py-1 text-[10px] font-semibold transition"
              style={{ background: light ? '#ecfdf5' : '#0d2200', color: metricColor, border: `1px solid ${light ? '#a7f3d0' : '#14532d'}` }}
              onClick={() => setAlertEdit({ slug: c.clientSlug, nombre: c.nombre, value: c.alertNumber })}
            >
              Alertas
            </button>
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
