'use client';

import type { ClientPanelBrand } from '@/lib/client-panel-config';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPanelTokenFromUrl } from '@/lib/client-panel-hooks';

type Props = {
  brand: ClientPanelBrand;
  clientId: string;
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
};

export function QrModal({ brand, clientId, open, onClose, onConnected }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const token = getPanelTokenFromUrl();
    if (!token) return;

    const es = new EventSource(
      `/api/panel/${clientId}/whatsapp/qr?token=${encodeURIComponent(token)}`,
      { withCredentials: false }
    );

    es.addEventListener('qr', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener('error', () => {
      setError('No se pudo cargar el código QR');
    });

    const statusPoll = setInterval(async () => {
      try {
        const res = await fetch(`/api/panel/${clientId}/whatsapp/status`, {
          headers: { 'x-client-token': token },
        });
        const data = await res.json();
        if (data.connected) {
          onConnected();
          onClose();
        }
      } catch {
        /* ignore */
      }
    }, 4000);

    return () => {
      es.close();
      clearInterval(statusPoll);
    };
  }, [open, clientId, onClose, onConnected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white max-w-md w-full p-6 relative"
        style={{ borderRadius: brand.radius, border: `1px solid ${brand.border}` }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-2">Conectar WhatsApp</h2>
        <p className="text-[15px] opacity-75 mb-4">
          Escanea este código con WhatsApp en tu teléfono → Dispositivos vinculados.
        </p>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Código QR WhatsApp" className="mx-auto w-[280px] h-[280px]" />
        ) : (
          <div className="h-[280px] flex items-center justify-center opacity-60">Generando QR...</div>
        )}
      </div>
    </div>
  );
}
