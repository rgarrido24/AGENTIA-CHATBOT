'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADDON_KEYS, ADDON_LABELS, type AddonKey } from '@/lib/client-addons';
import WhatsAppConnectButton from './WhatsAppConnectButton';

type Values = Record<AddonKey, boolean>;

/** Botón "Add-ons" con su ventana: activa/desactiva add-ons de un cliente y, si aplica, conecta su número. */
export default function AddonsButton({
  resellerId,
  clientSlug,
  nombre,
  initial,
  light,
  className,
  style,
}: {
  resellerId: string;
  clientSlug: string;
  nombre: string;
  initial?: Values;
  light: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(initial ?? { whatsappApi: false, forms: false });
  const [saving, setSaving] = useState<AddonKey | null>(null);

  const text = light ? '#0f172a' : '#fff';
  const sub = light ? '#64748b' : '#888';
  const border = light ? 'rgba(15,23,42,0.12)' : '#2a2a2a';

  async function toggle(key: AddonKey, value: boolean) {
    setSaving(key);
    try {
      const res = await fetch(`/api/portal/${resellerId}/client/${clientSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addons: { [key]: value } }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; addons?: Values };
      if (!res.ok) return alert(data.error || 'No se pudo guardar');
      setValues(data.addons ?? { ...values, [key]: value });
      router.refresh();
    } catch {
      alert('Error de conexión');
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <button type="button" title="Activar o desactivar add-ons de este cliente" className={className} style={style} onClick={() => setOpen(true)}>
        Add-ons
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border p-4 shadow-xl" style={{ background: light ? '#ffffff' : '#141414', borderColor: border, color: text }}>
            <p className="text-sm font-bold" style={{ color: text }}>Add-ons</p>
            <p className="text-xs mt-1" style={{ color: sub }}>{nombre}</p>
            <div className="mt-3 space-y-2">
              {ADDON_KEYS.map((key) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm" style={{ color: text }}>
                  <span>{ADDON_LABELS[key]}</span>
                  <input type="checkbox" checked={values[key]} disabled={saving !== null} onChange={(e) => void toggle(key, e.target.checked)} />
                </label>
              ))}
            </div>
            {values.forms && (
              <a href={`/portal/${resellerId}/cliente/${clientSlug}/formularios`} className="mt-3 block text-xs underline" style={{ color: text }}>
                Abrir formularios a WhatsApp →
              </a>
            )}
            {values.whatsappApi && <WhatsAppConnectButton resellerId={resellerId} clientSlug={clientSlug} />}
            <div className="flex justify-end mt-4">
              <button type="button" className="rounded-lg px-3 py-1.5 text-xs" style={{ background: light ? '#e2e8f0' : '#222', color: text }} onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
