'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Receipt,
  RotateCcw,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { POINTS_RATE } from '@/lib/wallet-sabucan-points';
import {
  WalletButton,
  formatMxn,
  sabucanInputClass,
  sabucanLabelClass,
  type SabucanClienteUi,
} from '../_components';

type Step = 'form' | 'confirm' | 'done';

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; cliente: SabucanClienteUi }
  | { status: 'new'; telefono: string }
  | { status: 'error'; message: string };

export default function SabucanCajaPage() {
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const [step, setStep] = useState<Step>('form');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    mensaje: string;
    puntosGanados: number;
    cliente: SabucanClienteUi;
  } | null>(null);

  const montoNum = Number(monto);
  const puntosPreview = useMemo(() => {
    if (!Number.isFinite(montoNum) || montoNum <= 0) return 0;
    return Math.floor(montoNum / POINTS_RATE);
  }, [montoNum]);

  async function buscarCliente() {
    setFormError(null);
    setLookup({ status: 'loading' });
    try {
      const q = encodeURIComponent(telefono.trim());
      const res = await fetch(`/api/sabucan/cliente?telefono=${q}`);
      const json = (await res.json()) as {
        found?: boolean;
        telefono?: string;
        cliente?: SabucanClienteUi | null;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'Error al buscar');
      if (json.found && json.cliente) {
        setLookup({ status: 'found', cliente: json.cliente });
        setStep('confirm');
      } else {
        setLookup({ status: 'new', telefono: json.telefono ?? telefono.replace(/\D/g, '') });
        setStep('confirm');
      }
    } catch (e) {
      setLookup({
        status: 'error',
        message: e instanceof Error ? e.message : 'Error al buscar',
      });
    }
  }

  async function confirmarVenta() {
    setFormError(null);
    setSaving(true);
    try {
      const body: { telefono: string; monto: number; nombre?: string } = {
        telefono: telefono.trim(),
        monto: montoNum,
      };
      if (lookup.status === 'new') {
        body.nombre = nombreNuevo.trim();
      }
      const res = await fetch('/api/sabucan/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        mensaje?: string;
        puntosGanados?: number;
        cliente?: SabucanClienteUi;
        error?: string;
      };
      if (!res.ok || !json.cliente) throw new Error(json.error ?? 'No se pudo registrar');
      setResultado({
        mensaje:
          json.mensaje ??
          `Venta registrada — ${json.puntosGanados} puntos agregados, saldo total: ${json.cliente.puntos} puntos`,
        puntosGanados: json.puntosGanados ?? 0,
        cliente: json.cliente,
      });
      setStep('done');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al registrar venta');
    } finally {
      setSaving(false);
    }
  }

  function reiniciar() {
    setTelefono('');
    setMonto('');
    setNombreNuevo('');
    setLookup({ status: 'idle' });
    setStep('form');
    setResultado(null);
    setFormError(null);
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-[family-name:var(--font-space)] text-xs font-medium uppercase tracking-[0.2em] text-[#00D4FF]">
          Flujo de caja
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-space)] text-3xl font-bold tracking-tight">
          Registrar venta
        </h1>
        <p className="mt-2 text-sm text-white/50">
          1 punto por cada ${POINTS_RATE} MXN · Tablet / laptop de recepción
        </p>
      </div>

      {step === 'done' && resultado ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#00D4FF]/30 bg-[#00D4FF]/[0.07] p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-[#00D4FF]" />
              <div>
                <p className="font-[family-name:var(--font-space)] text-lg font-bold text-white">
                  Venta registrada
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{resultado.mensaje}</p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-wider text-white/40">Cliente</dt>
                    <dd className="mt-1 font-semibold">{resultado.cliente.nombre}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-wider text-white/40">+ Puntos</dt>
                    <dd className="mt-1 font-[family-name:var(--font-space)] text-xl font-bold text-[#00D4FF]">
                      +{resultado.puntosGanados}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-wider text-white/40">Saldo</dt>
                    <dd className="mt-1 font-[family-name:var(--font-space)] text-xl font-bold text-[#FFD700]">
                      {resultado.cliente.puntos}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <WalletButton cliente={resultado.cliente} />

          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Nueva venta
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="space-y-4">
              <div>
                <label className={sabucanLabelClass()} htmlFor="tel">
                  Teléfono del cliente
                </label>
                <input
                  id="tel"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="999 123 4567"
                  value={telefono}
                  disabled={step === 'confirm'}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={sabucanInputClass()}
                />
              </div>
              <div>
                <label className={sabucanLabelClass()} htmlFor="monto">
                  Monto de la venta (MXN)
                </label>
                <input
                  id="monto"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={1}
                  placeholder="250"
                  value={monto}
                  disabled={step === 'confirm'}
                  onChange={(e) => setMonto(e.target.value)}
                  className={sabucanInputClass()}
                />
                {puntosPreview > 0 ? (
                  <p className="mt-2 text-xs text-[#00D4FF]/80">
                    Esta compra suma <strong>+{puntosPreview} puntos</strong>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-white/35">
                    Compras menores a ${POINTS_RATE} no generan puntos
                  </p>
                )}
              </div>
            </div>

            {step === 'form' ? (
              <button
                type="button"
                onClick={() => void buscarCliente()}
                disabled={lookup.status === 'loading' || !telefono.trim() || !(montoNum > 0)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00D4FF] px-5 py-3.5 text-sm font-bold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {lookup.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                Continuar
              </button>
            ) : null}

            {lookup.status === 'error' ? (
              <p className="mt-3 text-sm text-red-400">{lookup.message}</p>
            ) : null}
          </div>

          {step === 'confirm' && lookup.status === 'found' ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[#00D4FF]">
                <UserRound className="h-5 w-5" />
                <p className="font-[family-name:var(--font-space)] text-sm font-semibold">
                  Cliente encontrado
                </p>
              </div>
              <p className="mt-3 text-xl font-semibold">{lookup.cliente.nombre}</p>
              <p className="mt-1 text-sm text-white/50">{lookup.cliente.telefono}</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-3 py-1 text-sm font-semibold text-[#FFD700]">
                Saldo actual: {lookup.cliente.puntos} puntos
              </p>
              <p className="mt-4 text-sm text-white/55">
                Venta {formatMxn(montoNum)} → +{puntosPreview} pts · nuevo saldo estimado:{' '}
                <strong className="text-white">{lookup.cliente.puntos + puntosPreview}</strong>
              </p>
            </div>
          ) : null}

          {step === 'confirm' && lookup.status === 'new' ? (
            <div className="rounded-3xl border border-dashed border-[#00D4FF]/35 bg-[#00D4FF]/[0.05] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[#00D4FF]">
                <UserPlus className="h-5 w-5" />
                <p className="font-[family-name:var(--font-space)] text-sm font-semibold">
                  Cliente nuevo
                </p>
              </div>
              <p className="mt-2 text-sm text-white/55">
                No hay registro con {lookup.telefono}. Ingresa el nombre para crearlo.
              </p>
              <div className="mt-4">
                <label className={sabucanLabelClass()} htmlFor="nombre">
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="María López"
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  className={sabucanInputClass()}
                />
              </div>
            </div>
          ) : null}

          {step === 'confirm' ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setLookup({ status: 'idle' });
                  setFormError(null);
                }}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/70 hover:border-white/30 hover:text-white"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => void confirmarVenta()}
                disabled={
                  saving ||
                  (lookup.status === 'new' && !nombreNuevo.trim()) ||
                  lookup.status === 'loading'
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00D4FF] px-5 py-3.5 text-sm font-bold text-[#0a0a0a] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar venta
              </button>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
        </div>
      )}
    </div>
  );
}
