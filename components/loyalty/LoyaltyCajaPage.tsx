'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Receipt,
  RotateCcw,
  Search,
  UserPlus,
  UserRound,
} from 'lucide-react';
import {
  POINTS_RATE,
  calcularPuntosCashback,
  formatPuntos,
  roundPuntos,
} from '@/lib/wallet-sabucan-points';
import { tenantCashbackPct, tenantRecompensa } from '@/lib/wallet-tenant';
import { useLoyaltyTenant } from './tenant-context';
import {
  SendPassWhatsAppButton,
  formatMxn,
  loyaltyInputClass,
  loyaltyLabelClass,
  type LoyaltyClienteUi,
} from './_ui';
import { LoyaltyQrScanner } from './QrScanner';

type Phase = 'lookup' | 'use_points' | 'points_amount' | 'sale' | 'done';

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; cliente: LoyaltyClienteUi }
  | { status: 'new'; telefono: string }
  | { status: 'error'; message: string };

type UsePointsChoice = 'unset' | 'yes' | 'no';

export function LoyaltyCajaPage({ tenantId }: { tenantId: string }) {
  const tenant = useLoyaltyTenant(tenantId);
  const accent = tenant?.colorAcento ?? '#F2691F';
  const primary = tenant?.colorPrimario ?? '#1E2340';
  const apiBase = `/api/loyalty/${tenantId}`;
  const rec = tenant ? tenantRecompensa(tenant) : { modelo: 'cashback' as const, parametro: 1 };
  const isSellos = rec.modelo === 'sellos';
  const cashbackPct = tenant ? tenantCashbackPct(tenant) : 1;
  const sellosMeta = rec.parametro;

  const [telefono, setTelefono] = useState('');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const [phase, setPhase] = useState<Phase>('lookup');

  const [usePoints, setUsePoints] = useState<UsePointsChoice>('unset');
  const [puntosAUsar, setPuntosAUsar] = useState('');
  const [montoTicket, setMontoTicket] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    mensaje: string;
    puntosGanados: number;
    puntosUsados: number;
    cliente: LoyaltyClienteUi;
  } | null>(null);

  const clienteFound = lookup.status === 'found' ? lookup.cliente : null;
  const saldoDisponible = roundPuntos(clienteFound?.puntos ?? 0);

  const puntosUsarNum = roundPuntos(Number(puntosAUsar));
  const ticketNum = Number(montoTicket);

  const descuentoMxn = useMemo(() => {
    if (usePoints !== 'yes' || !(puntosUsarNum > 0)) return 0;
    return puntosUsarNum;
  }, [usePoints, puntosUsarNum]);

  const aPagar = useMemo(() => {
    if (!Number.isFinite(ticketNum) || ticketNum <= 0) return 0;
    if (usePoints !== 'yes') return ticketNum;
    return Math.max(0, roundPuntos(ticketNum - descuentoMxn));
  }, [ticketNum, usePoints, descuentoMxn]);

  const montoVenta = aPagar;
  const puntosPreview = useMemo(
    () => calcularPuntosCashback(montoVenta, cashbackPct),
    [montoVenta, cashbackPct],
  );

  const puntosUsarValidos =
    usePoints !== 'yes' ||
    (Number.isFinite(puntosUsarNum) &&
      puntosUsarNum > 0 &&
      puntosUsarNum <= saldoDisponible);

  const altaValida =
    lookup.status !== 'new' ||
    (nombreNuevo.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento));

  const ventaLista = isSellos
    ? altaValida &&
      (usePoints !== 'yes' ||
        (lookup.status === 'found' && saldoDisponible >= sellosMeta))
    : altaValida &&
      Number.isFinite(ticketNum) &&
      ticketNum > 0 &&
      (usePoints !== 'yes' || puntosUsarValidos) &&
      (montoVenta > 0 || (usePoints === 'yes' && puntosUsarNum > 0));

  async function buscarCliente() {
    setFormError(null);
    setLookup({ status: 'loading' });
    setUsePoints('unset');
    setPuntosAUsar('');
    setMontoTicket('');
    try {
      const q = encodeURIComponent(telefono.trim());
      const res = await fetch(`${apiBase}/cliente?telefono=${q}`);
      const json = (await res.json()) as {
        found?: boolean;
        telefono?: string;
        cliente?: LoyaltyClienteUi | null;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'Error al buscar');
      if (json.found && json.cliente) {
        setLookup({ status: 'found', cliente: json.cliente });
        if (isSellos) {
          setUsePoints('no');
          setPhase('sale');
        } else if (roundPuntos(json.cliente.puntos ?? 0) > 0) {
          setPhase('use_points');
        } else {
          setUsePoints('no');
          setPhase('sale');
        }
      } else {
        setLookup({
          status: 'new',
          telefono: json.telefono ?? telefono.replace(/\D/g, ''),
        });
        setUsePoints('no');
        setPhase('sale');
      }
    } catch (e) {
      setLookup({
        status: 'error',
        message: e instanceof Error ? e.message : 'Error al buscar',
      });
      setPhase('lookup');
    }
  }

  async function confirmarVentaYCanje() {
    setFormError(null);
    setSaving(true);
    try {
      const tel = telefono.trim();
      let puntosUsados = 0;
      let puntosGanados = 0;
      let clienteFinal: LoyaltyClienteUi | null = null;

      const quiereCanje =
        lookup.status === 'found' &&
        usePoints === 'yes' &&
        (isSellos ? saldoDisponible >= sellosMeta : puntosUsarNum > 0);
      const hayVenta = isSellos ? usePoints !== 'yes' : montoVenta > 0;

      if (!quiereCanje && !hayVenta) {
        throw new Error(isSellos ? 'No hay visita que registrar' : 'Ingresa un monto de venta válido');
      }

      if (quiereCanje) {
        const canjeRes = await fetch(`${apiBase}/canje`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefono: tel,
            puntos: isSellos ? sellosMeta : puntosUsarNum,
            skipWalletSync: hayVenta,
          }),
        });
        const canjeJson = (await canjeRes.json()) as {
          ok?: boolean;
          puntosCanjeados?: number;
          cliente?: LoyaltyClienteUi;
          error?: string;
        };
        if (!canjeRes.ok || !canjeJson.cliente) {
          throw new Error(canjeJson.error ?? 'No se pudo canjear puntos');
        }
        puntosUsados = canjeJson.puntosCanjeados ?? puntosUsarNum;
        clienteFinal = canjeJson.cliente;
      }

      if (hayVenta) {
        const body: {
          telefono: string;
          monto: number;
          nombreCompleto?: string;
          fechaNacimiento?: string;
        } = { telefono: tel, monto: isSellos ? 0 : montoVenta };
        if (lookup.status === 'new') {
          body.nombreCompleto = nombreNuevo.trim();
          body.fechaNacimiento = fechaNacimiento;
        }
        const ventaRes = await fetch(`${apiBase}/venta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const ventaJson = (await ventaRes.json()) as {
          ok?: boolean;
          puntosGanados?: number;
          cliente?: LoyaltyClienteUi;
          error?: string;
        };
        if (!ventaRes.ok || !ventaJson.cliente) {
          throw new Error(ventaJson.error ?? 'No se pudo registrar la venta');
        }
        puntosGanados = ventaJson.puntosGanados ?? 0;
        clienteFinal = ventaJson.cliente;
      }

      if (!clienteFinal) throw new Error('No hubo movimientos que registrar');

      const partes: string[] = [];
      if (puntosUsados > 0) {
        partes.push(
          isSellos
            ? `Canjeó ${Math.round(puntosUsados)} sellos por una recompensa`
            : `Usó ${formatPuntos(puntosUsados)} puntos (−${formatMxn(puntosUsados)})`,
        );
      }
      if (hayVenta) {
        partes.push(
          isSellos
            ? `Sumó ${Math.round(puntosGanados)} sello`
            : `Ganó ${formatPuntos(puntosGanados)} pts por ${formatMxn(montoVenta)} cobrados`,
        );
      }
      partes.push(
        isSellos
          ? `Total: ${Math.round(clienteFinal.puntos)} / ${sellosMeta} sellos`
          : `Saldo: ${formatPuntos(clienteFinal.puntos)} pts`,
      );

      setResultado({
        mensaje: partes.join(' · '),
        puntosGanados,
        puntosUsados,
        cliente: clienteFinal,
      });
      setPhase('done');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al confirmar');
    } finally {
      setSaving(false);
    }
  }

  function reiniciar() {
    setTelefono('');
    setLookup({ status: 'idle' });
    setPhase('lookup');
    setUsePoints('unset');
    setPuntosAUsar('');
    setMontoTicket('');
    setNombreNuevo('');
    setFechaNacimiento('');
    setResultado(null);
    setFormError(null);
  }

  function volverALookup() {
    setLookup({ status: 'idle' });
    setPhase('lookup');
    setUsePoints('unset');
    setPuntosAUsar('');
    setMontoTicket('');
    setFormError(null);
  }

  const lockedAfterLookup = phase !== 'lookup';

  return (
    <div>
      <div className="mb-8">
        <p
          className="font-[family-name:var(--font-space)] text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Flujo de caja
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-space)] text-3xl font-bold tracking-tight">
          Registrar {isSellos ? 'visita' : 'venta'}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {isSellos
            ? `1 sello por visita · junta ${sellosMeta} y el siguiente es gratis`
            : cashbackPct === 1
              ? `1 punto por cada $${POINTS_RATE} MXN`
              : `${cashbackPct}% de cashback en puntos (1 punto = $1 MXN)`}{' '}
          {isSellos ? '' : '· canje integrado en la misma venta'}
        </p>
      </div>

      {phase === 'done' && resultado ? (
        <div className="space-y-5">
          <div
            className="rounded-3xl border p-6 sm:p-8"
            style={{
              borderColor: `${accent}59`,
              backgroundColor: `${accent}14`,
            }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0" style={{ color: accent }} />
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-space)] text-lg font-bold text-white">
                  {isSellos ? 'Listo' : 'Venta registrada'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{resultado.mensaje}</p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-wider text-white/40">Cliente</dt>
                    <dd className="mt-1 font-semibold">
                      {resultado.cliente.nombreCompleto || resultado.cliente.nombre}
                    </dd>
                  </div>
                  {resultado.puntosUsados > 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <dt className="text-[10px] uppercase tracking-wider text-white/40">
                        {isSellos ? 'Sellos usados' : 'Puntos usados'}
                      </dt>
                      <dd className="mt-1 font-[family-name:var(--font-space)] text-xl font-bold text-red-300">
                        −{formatPuntos(resultado.puntosUsados)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-wider text-white/40">
                      {isSellos ? 'Sellos ganados' : 'Puntos ganados'}
                    </dt>
                    <dd
                      className="mt-1 font-[family-name:var(--font-space)] text-xl font-bold"
                      style={{ color: accent }}
                    >
                      +{formatPuntos(resultado.puntosGanados)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-wider text-white/40">
                      {isSellos ? 'Sellos' : 'Saldo total'}
                    </dt>
                    <dd className="mt-1 font-[family-name:var(--font-space)] text-xl font-bold text-white">
                      {isSellos
                        ? `${Math.round(resultado.cliente.puntos)} / ${sellosMeta}`
                        : formatPuntos(resultado.cliente.puntos)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <SendPassWhatsAppButton cliente={resultado.cliente} tenantId={tenantId} />

          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Nueva {isSellos ? 'visita' : 'venta'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <label className={loyaltyLabelClass()} htmlFor="tel">
              Teléfono del cliente
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="tel"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="999 123 4567"
                value={telefono}
                disabled={lockedAfterLookup}
                onChange={(e) => setTelefono(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && phase === 'lookup' && telefono.trim()) {
                    void buscarCliente();
                  }
                }}
                className={loyaltyInputClass()}
              />
              <LoyaltyQrScanner
                disabled={lockedAfterLookup}
                accentColor={accent}
                primaryColor={primary}
                onScan={(tel) => {
                  setTelefono(tel);
                  setFormError(null);
                }}
              />
            </div>
            <p className="mt-2 text-xs text-white/35">
              Escanea el QR del pase o teclea el teléfono.
            </p>

            {phase === 'lookup' ? (
              <button
                type="button"
                onClick={() => void buscarCliente()}
                disabled={lookup.status === 'loading' || !telefono.trim()}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                {lookup.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar cliente
              </button>
            ) : null}

            {lookup.status === 'error' ? (
              <p className="mt-3 text-sm text-red-400">{lookup.message}</p>
            ) : null}
          </div>

          {clienteFound && phase !== 'lookup' ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center gap-2" style={{ color: accent }}>
                <UserRound className="h-5 w-5" />
                <p className="font-[family-name:var(--font-space)] text-sm font-semibold">
                  Cliente encontrado
                </p>
              </div>
              <p className="mt-3 text-xl font-semibold">
                {clienteFound.nombreCompleto || clienteFound.nombre} —{' '}
                <span style={{ color: accent }}>
                  {isSellos
                    ? `${Math.round(clienteFound.puntos)} / ${sellosMeta} sellos`
                    : `${formatPuntos(clienteFound.puntos)} puntos disponibles`}
                </span>
              </p>
              <p className="mt-1 text-sm text-white/50">{clienteFound.telefono}</p>
            </div>
          ) : null}

          {lookup.status === 'new' && phase === 'sale' ? (
            <div
              className="rounded-3xl border border-dashed p-5 sm:p-6"
              style={{
                borderColor: `${accent}66`,
                backgroundColor: `${accent}0f`,
              }}
            >
              <div className="flex items-center gap-2" style={{ color: accent }}>
                <UserPlus className="h-5 w-5" />
                <p className="font-[family-name:var(--font-space)] text-sm font-semibold">
                  Cliente nuevo
                </p>
              </div>
              <p className="mt-2 text-sm text-white/55">
                No hay registro con {lookup.telefono}. Completa los datos para darlo de alta.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className={loyaltyLabelClass()} htmlFor="nombre">
                    Nombre completo
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    autoComplete="name"
                    placeholder="María López García"
                    value={nombreNuevo}
                    onChange={(e) => setNombreNuevo(e.target.value)}
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
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className={loyaltyInputClass()}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {phase === 'use_points' && clienteFound && !isSellos ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="font-[family-name:var(--font-space)] text-base font-semibold">
                ¿Desea usar sus puntos en esta compra?
              </p>
              <p className="mt-1 text-sm text-white/50">
                Tiene {formatPuntos(saldoDisponible)} puntos (
                {formatMxn(saldoDisponible)} de descuento posible).
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setUsePoints('yes');
                    setPhase('points_amount');
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsePoints('no');
                    setPuntosAUsar('');
                    setPhase('sale');
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/80 hover:border-white/30 hover:text-white"
                >
                  No
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'points_amount' && clienteFound && !isSellos ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <label className={loyaltyLabelClass()} htmlFor="pts-usar">
                ¿Cuántos puntos desea usar? (máx. {formatPuntos(saldoDisponible)})
              </label>
              <input
                id="pts-usar"
                type="number"
                inputMode="decimal"
                min={0.1}
                max={saldoDisponible}
                step={0.1}
                placeholder="Ej. 45.5"
                value={puntosAUsar}
                onChange={(e) => setPuntosAUsar(e.target.value)}
                className={loyaltyInputClass()}
              />
              {puntosAUsar !== '' && !puntosUsarValidos ? (
                <p className="mt-2 text-sm text-red-400">
                  Debe ser mayor a 0 y no superar {formatPuntos(saldoDisponible)} puntos
                </p>
              ) : null}
              {puntosUsarValidos && puntosUsarNum > 0 ? (
                <p className="mt-2 text-xs" style={{ color: `${accent}e6` }}>
                  Descuento: <strong>{formatMxn(puntosUsarNum)}</strong>
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setUsePoints('unset');
                    setPuntosAUsar('');
                    setPhase('use_points');
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/70 hover:border-white/30 hover:text-white"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={!puntosUsarValidos || !(puntosUsarNum > 0)}
                  onClick={() => setPhase('sale')}
                  className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  Continuar
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'sale' && isSellos ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              {lookup.status === 'found' && saldoDisponible >= sellosMeta ? (
                <div className="mb-6">
                  <p className="font-[family-name:var(--font-space)] text-base font-semibold">
                    ¿Canjear recompensa? (usa {sellosMeta} sellos)
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    Tiene {Math.round(saldoDisponible)} sellos. El canje no suma sello extra.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setUsePoints('yes')}
                      className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white hover:opacity-90"
                      style={{
                        backgroundColor: usePoints === 'yes' ? accent : 'transparent',
                        border:
                          usePoints === 'yes' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        color: usePoints === 'yes' ? '#fff' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      Sí, canjear
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsePoints('no')}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/80 hover:border-white/30 hover:text-white"
                      style={{
                        backgroundColor: usePoints === 'no' ? `${accent}33` : 'transparent',
                      }}
                    >
                      No, sumar 1 sello
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mb-4 text-sm text-white/60">
                  Esta visita suma <strong style={{ color: accent }}>+1 sello</strong>
                  {lookup.status === 'found'
                    ? ` · quedaría en ${Math.round(saldoDisponible) + 1} / ${sellosMeta}`
                    : ` · arranca en 1 / ${sellosMeta}`}
                  .
                </p>
              )}

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    volverALookup();
                    setFormError(null);
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/70 hover:border-white/30 hover:text-white"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarVentaYCanje()}
                  disabled={saving || !ventaLista}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                  {usePoints === 'yes' ? 'Canjear recompensa' : 'Sumar 1 sello'}
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'sale' && !isSellos ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <label className={loyaltyLabelClass()} htmlFor="monto">
                {usePoints === 'yes'
                  ? 'Monto total de la compra (antes de puntos)'
                  : 'Monto de la venta (MXN)'}
              </label>
              <input
                id="monto"
                type="number"
                inputMode="decimal"
                min={0.01}
                step={0.01}
                placeholder="150"
                value={montoTicket}
                onChange={(e) => setMontoTicket(e.target.value)}
                className={loyaltyInputClass()}
              />

              {usePoints === 'yes' && ticketNum > 0 && puntosUsarNum > 0 ? (
                <p
                  className="mt-3 rounded-2xl border px-4 py-3 text-sm text-white/85"
                  style={{
                    borderColor: `${accent}4d`,
                    backgroundColor: `${accent}1a`,
                  }}
                >
                  Total: {formatMxn(ticketNum)} − {formatMxn(descuentoMxn)} en puntos ={' '}
                  <strong style={{ color: accent }}>{formatMxn(aPagar)} a pagar</strong>
                </p>
              ) : null}

              {montoVenta > 0 ? (
                <p className="mt-2 text-xs" style={{ color: `${accent}e6` }}>
                  La venta suma <strong>+{formatPuntos(puntosPreview)} puntos</strong> sobre{' '}
                  {formatMxn(montoVenta)} cobrados
                </p>
              ) : usePoints === 'yes' && ticketNum > 0 && aPagar === 0 ? (
                <p className="mt-2 text-xs text-white/50">
                  La compra queda cubierta con puntos (solo se registra el canje).
                </p>
              ) : (
                <p className="mt-2 text-xs text-white/35">Ingresa el monto de la compra</p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    if (lookup.status === 'found' && saldoDisponible > 0) {
                      if (usePoints === 'yes') setPhase('points_amount');
                      else setPhase('use_points');
                    } else {
                      volverALookup();
                    }
                    setFormError(null);
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/70 hover:border-white/30 hover:text-white"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarVentaYCanje()}
                  disabled={saving || !ventaLista}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                  Confirmar
                </button>
              </div>
            </div>
          ) : null}

          {lockedAfterLookup && phase !== 'sale' ? (
            <button
              type="button"
              onClick={volverALookup}
              className="text-sm text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Cambiar teléfono
            </button>
          ) : null}

          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
        </div>
      )}
    </div>
  );
}
