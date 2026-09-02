'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Smartphone } from 'lucide-react';

const BRAND = {
  bg: '#140810',
  border: 'rgba(236, 0, 140, 0.22)',
  accent: '#EC008C',
} as const;

type WaStatus = {
  clientId: string;
  connected: boolean;
  hasQr: boolean;
  qrDataUrl: string | null;
  updatedAt: string | null;
  bridgeSeen: boolean;
  source?: 'bridge' | 'mongo' | 'activity' | 'none';
  lastMessageAt?: string | null;
};

function fmtWhen(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-MX');
}

export default function IzziWhatsappPage() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reseting, setReseting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/izzi-panel/whatsapp', { cache: 'no-store' });
      const data = (await res.json()) as WaStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error al consultar');
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al consultar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [load]);

  async function revincular() {
    if (
      !confirm(
        'Se cerrará la sesión actual de WhatsApp y tendrás que escanear un QR nuevo. ¿Continuar?',
      )
    ) {
      return;
    }
    setReseting(true);
    setError(null);
    try {
      const res = await fetch('/api/izzi-panel/whatsapp', { method: 'POST' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se pudo reiniciar');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reiniciar');
    } finally {
      setReseting(false);
    }
  }

  return (
    <main
      className="min-h-[100dvh] text-stone-100"
      style={{ background: `linear-gradient(160deg, ${BRAND.bg} 0%, #2a0a1c 50%, #140810 100%)` }}
    >
      <header
        className="border-b px-4 py-4"
        style={{ borderColor: BRAND.border, background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/izzi-panel/conversaciones"
              className="inline-flex items-center gap-1.5 text-xs text-pink-200/60 hover:text-pink-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Conversaciones
            </Link>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-pink-50">
              <Smartphone className="h-5 w-5 text-pink-400" />
              Vincular WhatsApp
            </h1>
            {status?.clientId ? (
              <p className="mt-1 text-xs text-pink-200/50">
                Cuenta <span className="font-medium text-pink-200/80">{status.clientId}</span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 py-2 text-sm text-pink-100/90 transition hover:bg-white/5"
            style={{ borderColor: BRAND.border }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {loading && !status ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border py-16 text-sm text-pink-200/60"
            style={{ borderColor: BRAND.border }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando estado…
          </div>
        ) : null}

        {status?.connected ? (
          <div
            className="rounded-2xl border px-6 py-10 text-center"
            style={{ borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)' }}
          >
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="mt-3 text-lg font-semibold text-emerald-200">
              {status.source === 'activity' ? 'WhatsApp activo — el bot está contestando' : 'WhatsApp conectado'}
            </p>
            <p className="mt-1 text-sm text-emerald-200/60">
              {status.source === 'activity'
                ? 'El marcador de QR no se actualizó, pero hay mensajes recientes. Puedes pausar chats desde Conversaciones.'
                : `Última señal: ${fmtWhen(status.updatedAt)}`}
            </p>
          </div>
        ) : null}

        {status && !status.connected && status.hasQr ? (
          <div
            className="rounded-2xl border px-6 py-8 text-center"
            style={{ borderColor: BRAND.border, background: 'rgba(255,255,255,0.04)' }}
          >
            <p className="text-sm text-pink-200/70">
              Escanea este código desde WhatsApp en el teléfono de esta cuenta.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={status.qrDataUrl ?? ''}
              alt="Código QR para vincular WhatsApp"
              className="mx-auto my-5 h-64 w-64 rounded-xl bg-white p-2"
            />
            <ol className="mx-auto max-w-sm space-y-1 text-left text-sm text-pink-200/60">
              <li>1. Abre WhatsApp en el celular</li>
              <li>2. Menú (⋮) → Dispositivos vinculados</li>
              <li>3. Toca Vincular dispositivo</li>
              <li>4. Escanea este código con el escáner de WhatsApp</li>
            </ol>
            <p className="mt-4 text-xs text-pink-200/40">
              El QR caduca en unos segundos; esta página se actualiza sola cada 10 s.
            </p>
          </div>
        ) : null}

        {status && !status.connected && !status.hasQr ? (
          <div
            className="rounded-2xl border px-6 py-10 text-center"
            style={{ borderColor: BRAND.border, background: 'rgba(255,255,255,0.04)' }}
          >
            <p className="text-lg font-semibold text-pink-50">Sin QR disponible</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-pink-200/60">
              {status.bridgeSeen
                ? 'El servicio de WhatsApp está desconectado y todavía no generó un código. Si no aparece en un par de minutos, fuerza una vinculación nueva.'
                : 'El servicio de WhatsApp aún no ha reportado esta cuenta. Verifica que el bridge esté corriendo.'}
            </p>
            <p className="mt-2 text-xs text-pink-200/40">
              Última señal: {fmtWhen(status.updatedAt)}
            </p>
          </div>
        ) : null}

        {status ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => void revincular()}
              disabled={reseting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold text-pink-100 transition hover:bg-white/5 disabled:opacity-40"
              style={{ borderColor: BRAND.border }}
            >
              {reseting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Forzar vinculación nueva
            </button>
            <p className="mx-auto mt-2 max-w-md text-xs text-pink-200/40">
              Borra la sesión guardada de esta cuenta. Úsalo si el QR no aparece o si WhatsApp
              cerró la sesión.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
