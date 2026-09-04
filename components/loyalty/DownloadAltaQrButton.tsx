'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

export function DownloadAltaQrButton({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/loyalty/${tenantId}/alta-qr`);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? 'No se pudo generar el QR');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-alta-${tenantId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al descargar el QR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => void descargar()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30 hover:text-white disabled:opacity-40"
      >
        <Download className="h-4 w-4" />
        {loading ? 'Generando…' : 'Descargar QR'}
      </button>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

