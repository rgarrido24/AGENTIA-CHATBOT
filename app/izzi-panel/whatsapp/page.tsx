'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { IzziPanelLogoutButton } from '@/components/izzi-panel/IzziPanelLogoutButton';
import { izziPanelBrand } from '@/lib/izzi-panel-brand';

type WaStatus = {
  clientId: string;
  connected: boolean;
  hasQr: boolean;
  qrDataUrl: string | null;
  updatedAt: string | null;
  bridgeSeen: boolean;
  source?: 'bridge' | 'mongo' | 'activity' | 'none';
  lastMessageAt?: string | null;
  resetPending?: boolean;
  hint?: string | null;
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
  const brand = izziPanelBrand(status?.clientId);

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
    const t = setInterval(() => void load(), 3_000);
    return () => clearInterval(t);
  }, [load]);

  async function revincular() {
    if (
      !confirm(
        'Se desvincula WhatsApp de este panel y aparece un QR nuevo para escanear. ¿Continuar?',
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

  const showQr = Boolean(status && !status.connected && status.hasQr && status.qrDataUrl);
  const waitingQr = Boolean(status && !status.connected && !status.hasQr);

  return (
    <main
      className="min-h-[100dvh] text-stone-100"
      style={{ background: `linear-gradient(160deg, ${brand.bg} 0%, ${brand.bgMid} 50%, ${brand.bg} 100%)` }}
    >
      <header
        className="border-b px-4 py-4"
        style={{ borderColor: brand.border, background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/izzi-panel/conversaciones"
              className={`inline-flex items-center gap-1.5 text-xs hover:opacity-90 ${brand.muted}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Conversaciones
            </Link>
            <h1 className={`mt-1 flex items-center gap-2 text-xl font-bold ${brand.heading}`}>
              {brand.logoSrc ? (
                <img src={brand.logoSrc} alt="" className="h-8 w-8 rounded-lg" />
              ) : (
                <Smartphone className={`h-5 w-5 ${brand.avatarFg}`} />
              )}
              Vincular WhatsApp
            </h1>
            {status?.clientId ? (
              <p className={`mt-1 text-xs ${brand.muted}`}>
                Cuenta <span className="font-medium opacity-90">{status.clientId}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 py-2 text-sm text-pink-100/90 transition hover:bg-white/5"
              style={{ borderColor: brand.border }}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <IzziPanelLogoutButton borderColor={brand.border} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {loading && !status ? (
          <div
            className="flex items-center justify-center gap-2 rounded-2xl border py-16 text-sm text-pink-200/60"
            style={{ borderColor: brand.border }}
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
            <p className="mt-3 text-lg font-semibold text-emerald-200">WhatsApp conectado</p>
            <p className="mt-1 text-sm text-emerald-200/60">
              Última señal: {fmtWhen(status.updatedAt)}
            </p>
            {status.hint ? (
              <p className="mx-auto mt-3 max-w-md text-sm text-emerald-100/70">{status.hint}</p>
            ) : null}
          </div>
        ) : null}

        {status && !status.connected && status.source === 'activity' && !showQr ? (
          <div
            className="mb-4 rounded-2xl border px-6 py-6 text-center"
            style={{ borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)' }}
          >
            <p className="text-lg font-semibold text-amber-100">WhatsApp no está vinculado ahora</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-amber-100/70">
              {status.hint ||
                'Hubo chats recientes, pero el teléfono puede haberse desconectado. Vuelve a escanear el QR.'}
            </p>
          </div>
        ) : null}

        {showQr ? (
          <div
            className="rounded-2xl border px-6 py-8 text-center"
            style={{ borderColor: brand.border, background: 'rgba(255,255,255,0.04)' }}
          >
            <p className="text-sm text-pink-200/70">
              Escanea este código desde WhatsApp en el teléfono de esta cuenta.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={status?.qrDataUrl ?? ''}
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
              El QR caduca en unos segundos; esta página se actualiza sola cada pocos segundos.
            </p>
          </div>
        ) : null}

        {waitingQr ? (
          <div
            className="rounded-2xl border px-6 py-10 text-center"
            style={{ borderColor: brand.border, background: 'rgba(255,255,255,0.04)' }}
          >
            <p className="text-lg font-semibold text-pink-50">
              {status?.resetPending ? 'Generando QR nuevo…' : 'Sin QR disponible'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-pink-200/60">
              {status?.resetPending
                ? 'El puente está borrando la sesión anterior. En unos segundos aparece el código. No hace falta recargar a mano.'
                : status?.hint ||
                  (status?.bridgeSeen
                    ? 'El servicio está desconectado y todavía no generó un código. Pulsa Volver a conectar.'
                    : 'El servicio de WhatsApp aún no ha reportado esta cuenta. Verifica que el bridge esté corriendo.')}
            </p>
            <p className="mt-2 text-xs text-pink-200/40">
              Última señal: {fmtWhen(status?.updatedAt ?? null)}
            </p>
          </div>
        ) : null}

        {status ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => void revincular()}
              disabled={reseting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-40"
              style={{ background: brand.accent }}
            >
              {reseting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Volver a conectar (nuevo QR)
            </button>
            <p className="mx-auto mt-2 max-w-md text-xs text-pink-200/40">
              Úsalo si desvinculaste el teléfono, si el panel dice conectado y no lo está, o si el
              QR no aparece. Esto no cierra tu sesión del panel, solo la de WhatsApp.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
