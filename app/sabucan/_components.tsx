'use client';

import { useState } from 'react';
import { Loader2, MessageCircle, Wallet } from 'lucide-react';
import { sabucanWaDigits } from '@/lib/sabucan-brand';
import { formatPuntos } from '@/lib/wallet-sabucan-points';

export type SabucanClienteUi = {
  id: string;
  telefono: string;
  nombre: string;
  nombreCompleto?: string;
  fechaNacimiento?: string | null;
  ultimaVisita?: string | null;
  puntos: number;
  historial: {
    fecha: string;
    monto: number;
    puntosGanados: number;
    tipo?: 'compra' | 'canje' | 'contacto_reactivacion';
    plantilla?: string;
  }[];
};

const INPUT =
  'w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 text-base text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#F2691F]/70';

const LABEL = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50';

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
    maximumFractionDigits: 2,
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

export function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export { formatPuntos };

/** Para /sabucan/buscar — el cajero puede generar el link; el cliente lo abre en su teléfono. */
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
          clienteNombre: cliente.nombreCompleto || cliente.nombre,
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F2691F]/50 bg-[#F2691F]/15 px-5 py-3.5 text-sm font-semibold text-[#F2691F] transition-all hover:bg-[#F2691F]/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {loading ? 'Generando pase…' : 'Agregar a Google Wallet'}
      </button>
      {error ? <p className="mt-2 text-center text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

/**
 * Flujo de caja: genera saveUrl y lo manda por WhatsApp al cliente
 * (el pase se abre en el celular del cliente, no en el de la tienda).
 */
export function SendPassWhatsAppButton({ cliente }: { cliente: SabucanClienteUi }) {
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
          clienteNombre: cliente.nombreCompleto || cliente.nombre,
          telefono: cliente.telefono,
          puntosActuales: cliente.puntos,
        }),
      });
      const json = (await res.json()) as { saveUrl?: string; error?: string };
      if (!res.ok || !json.saveUrl) {
        throw new Error(json.error ?? 'No se pudo generar el link del pase');
      }

      const first =
        (cliente.nombreCompleto || cliente.nombre).trim().split(/\s+/)[0] || 'cliente';
      const pts = formatPuntos(cliente.puntos);
      const text =
        `Hola ${first}, aquí está tu tarjeta de lealtad SABUCAN ` +
        `(tienes ${pts} puntos). Ábrela en tu celular para guardarla en Google Wallet:\n${json.saveUrl}`;
      const wa = `https://wa.me/${sabucanWaDigits(cliente.telefono)}?text=${encodeURIComponent(text)}`;
      window.open(wa, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar el link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: '#25D366' }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {loading ? 'Generando link…' : 'Enviar tarjeta por WhatsApp al cliente'}
      </button>
      {error ? <p className="mt-2 text-center text-xs text-red-300">{error}</p> : null}
      <p className="mt-2 text-center text-[11px] text-white/40">
        Se abre WhatsApp con el link para que el cliente lo guarde en su celular.
      </p>
    </div>
  );
}
