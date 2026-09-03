'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { getTenant, type TenantId } from '@/lib/wallet-tenant';
import {
  formatPuntos,
  loyaltyInputClass,
  loyaltyLabelClass,
  type LoyaltyClienteUi,
} from './_ui';

export function AltaClienteForm({ tenantId }: { tenantId: TenantId }) {
  const tenant = getTenant(tenantId);
  const accent = tenant?.colorAcento ?? '#F2691F';
  const negocioNombre = tenant?.nombre ?? 'nuestro negocio';
  const primary = tenant?.colorPrimario ?? '#1E2340';
  const logoUrl = tenant?.logoUrl;
  const [logoOk, setLogoOk] = useState(true);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cliente, setCliente] = useState<LoyaltyClienteUi | null>(null);
  const [esNuevo, setEsNuevo] = useState<boolean>(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const walletEndpoint = useMemo(() => {
    // Brief: usar `/api/wallet/carnitas` para Carnitas Granada.
    if (tenantId === 'carnitas_granada') return '/api/wallet/carnitas';
    return `/api/wallet/${tenantId}`;
  }, [tenantId]);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/loyalty/${tenantId}/alta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto,
          telefono,
          fechaNacimiento,
        }),
      });
      const json = (await res.json()) as { cliente?: LoyaltyClienteUi; esNuevo?: boolean; error?: string };
      if (!res.ok || !json.cliente) {
        throw new Error(json.error ?? 'No se pudo registrar');
      }
      setCliente(json.cliente);
      setEsNuevo(Boolean(json.esNuevo));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar');
    } finally {
      setSubmitting(false);
    }
  }

  async function onWallet() {
    if (!cliente) return;
    setWalletLoading(true);
    setWalletError(null);
    try {
      const clienteNombre = (cliente.nombreCompleto || cliente.nombre).trim();
      const res = await fetch(walletEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          clienteNombre,
          telefono: cliente.telefono,
          puntosActuales: cliente.puntos,
        }),
      });
      const json = (await res.json()) as { saveUrl?: string; error?: string };
      if (!res.ok || !json.saveUrl) {
        throw new Error(json.error ?? 'Error al generar Google Wallet');
      }
      window.location.href = json.saveUrl;
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : 'Error al abrir Google Wallet');
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: primary,
        ...({
          '--loyalty-primary': primary,
          '--loyalty-accent': accent,
        } as Record<string, string>),
      } as CSSProperties & Record<string, string>}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        {logoUrl && logoOk ? (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={negocioNombre}
              className="h-28 w-auto object-contain sm:h-32"
              onError={() => setLogoOk(false)}
            />
          </div>
        ) : null}
        <p
          className="font-[family-name:var(--font-space)] text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Auto-registro
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-space)] text-3xl font-bold tracking-tight">
          {logoUrl && logoOk ? 'Tarjeta de lealtad' : `${negocioNombre} · Tarjeta de lealtad`}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Registra tus datos y guarda tu tarjeta en tu celular.
        </p>
      </div>

      {!cliente ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="space-y-4">
            <div>
              <label className={loyaltyLabelClass()} htmlFor="nombre-completo">
                Nombre completo
              </label>
              <input
                id="nombre-completo"
                type="text"
                autoComplete="name"
                placeholder="María López García"
                value={nombreCompleto}
                disabled={submitting}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className={loyaltyInputClass()}
              />
            </div>

            <div>
              <label className={loyaltyLabelClass()} htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="999 123 4567"
                value={telefono}
                disabled={submitting}
                onChange={(e) => setTelefono(e.target.value)}
                className={loyaltyInputClass()}
              />
            </div>

            <div>
              <label className={loyaltyLabelClass()} htmlFor="fecha-nac">
                Fecha de nacimiento
              </label>
              <input
                id="fecha-nac"
                type="date"
                value={fechaNacimiento}
                disabled={submitting}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className={loyaltyInputClass()}
              />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <button
            type="button"
            disabled={submitting}
            onClick={() => void onSubmit()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {submitting ? 'Registrando…' : 'Agregar a Google Wallet'}
          </button>

          <p className="mt-3 text-[11px] text-white/35">
            Si ya te habías registrado, te mostraremos tu saldo actual.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0" style={{ color: accent }} />
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-space)] text-lg font-bold text-white">
                {esNuevo ? 'Registro creado' : 'Ya estabas registrado'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Saldo actual: <strong style={{ color: accent }}>{formatPuntos(cliente.puntos)} puntos</strong>.
              </p>
              <p className="mt-1 text-sm text-white/50">{cliente.telefono}</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => void onWallet()}
              disabled={walletLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: `${accent}80`,
                backgroundColor: `${accent}26`,
                color: accent,
              }}
            >
              {walletLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {walletLoading ? 'Generando pase…' : 'Agregar a Google Wallet'}
            </button>
            {walletError ? (
              <p className="mt-2 text-center text-xs text-red-400">{walletError}</p>
            ) : null}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

