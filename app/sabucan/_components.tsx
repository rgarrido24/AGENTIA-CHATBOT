'use client';

import { useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';

export type SabucanClienteUi = {
  id: string;
  telefono: string;
  nombre: string;
  puntos: number;
  historial: {
    fecha: string;
    monto: number;
    puntosGanados: number;
    tipo?: 'compra' | 'canje';
  }[];
};

const INPUT =
  'w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-base text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#00D4FF]/50';

const LABEL = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45';

export function sabucanInputClass() {
  return INPUT;
}

export function sabucanLabelClass() {
  return LABEL;
}

export function formatMxn(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WalletButton({ cliente }: { cliente: SabucanClienteUi }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/sabucan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          telefono: cliente.telefono,
          puntosActuales: cliente.puntos,
        }),
      });
      const json = (await res.json()) as { saveUrl?: string; error?: string };
      if (!res.ok || !json.saveUrl) {
        throw new Error(json.error ?? 'No se pudo generar el pase');
      }
      window.location.href = json.saveUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al abrir Google Wallet');
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/10 px-5 py-3.5 text-sm font-semibold text-[#00D4FF] transition-all hover:bg-[#00D4FF]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {loading ? 'Generando pase…' : 'Agregar a Google Wallet'}
      </button>
      {error ? <p className="mt-2 text-center text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
