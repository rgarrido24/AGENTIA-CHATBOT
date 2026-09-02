'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Gift,
  History,
  Loader2,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { roundPuntos } from '@/lib/wallet-sabucan-points';
import { getTenant, type TenantId } from '@/lib/wallet-tenant';
import {
  WalletButton,
  formatFecha,
  formatMxn,
  formatPuntos,
  loyaltyInputClass,
  loyaltyLabelClass,
  type LoyaltyClienteUi,
} from './_ui';

export function LoyaltyBuscarPage({ tenantId }: { tenantId: TenantId }) {
  const tenant = getTenant(tenantId);
  const accent = tenant?.colorAcento ?? '#F2691F';
  const basePath = tenant?.basePath ?? `/demo/${tenantId}`;
  const apiBase = `/api/loyalty/${tenantId}`;

  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cliente, setCliente] = useState<LoyaltyClienteUi | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [canjeOpen, setCanjeOpen] = useState(false);
  const [puntosCanje, setPuntosCanje] = useState('');
  const [canjeLoading, setCanjeLoading] = useState(false);
  const [canjeError, setCanjeError] = useState<string | null>(null);
  const [canjeOk, setCanjeOk] = useState<string | null>(null);

  async function buscar() {
    setError(null);
    setNotFound(false);
    setCliente(null);
    setCanjeOpen(false);
    setCanjeOk(null);
    setCanjeError(null);
    setPuntosCanje('');
    setLoading(true);
    try {
      const q = encodeURIComponent(telefono.trim());
      const res = await fetch(`${apiBase}/cliente?telefono=${q}`);
      const json = (await res.json()) as {
        found?: boolean;
        cliente?: LoyaltyClienteUi | null;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'Error al buscar');
      if (json.found && json.cliente) {
        setCliente(json.cliente);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCanje() {
    if (!cliente) return;
    setCanjeError(null);
    setCanjeOk(null);

    const pts = roundPuntos(Number(puntosCanje));
    if (!Number.isFinite(pts) || pts <= 0) {
      setCanjeError('Ingresa una cantidad válida de puntos');
      return;
    }
    if (pts > roundPuntos(cliente.puntos)) {
      setCanjeError(`No puedes canjear más de ${formatPuntos(cliente.puntos)} puntos`);
      return;
    }

    setCanjeLoading(true);
    try {
      const res = await fetch(`${apiBase}/canje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: cliente.telefono, puntos: pts }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        mensaje?: string;
        cliente?: LoyaltyClienteUi;
        error?: string;
      };
      if (!res.ok || !json.cliente) {
        throw new Error(json.error ?? 'No se pudo canjear');
      }
      setCliente(json.cliente);
      setCanjeOk(
        json.mensaje ??
          `Canjeados ${formatPuntos(pts)} puntos = ${formatMxn(pts)} de descuento. Saldo restante: ${formatPuntos(json.cliente.puntos)} puntos`,
      );
      setCanjeOpen(false);
      setPuntosCanje('');
    } catch (e) {
      setCanjeError(e instanceof Error ? e.message : 'Error al canjear');
    } finally {
      setCanjeLoading(false);
    }
  }

  const ultimas = cliente?.historial.slice(0, 5) ?? [];

  return (
    <div>
      <div className="mb-8">
        <p
          className="font-[family-name:var(--font-space)] text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Consulta
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-space)] text-3xl font-bold tracking-tight">
          Buscar cliente
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Nombre, saldo, canje (1 pt = $1 MXN, con decimales) y últimos movimientos
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <label className={loyaltyLabelClass()} htmlFor="buscar-tel">
          Teléfono
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="buscar-tel"
            type="tel"
            inputMode="numeric"
            placeholder="999 123 4567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void buscar();
            }}
            className={loyaltyInputClass()}
          />
          <button
            type="button"
            onClick={() => void buscar()}
            disabled={loading || !telefono.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {notFound ? (
          <p className="mt-3 text-sm text-white/50">
            No hay cliente con ese teléfono. Regístralo en{' '}
            <a
              href={`${basePath}/caja`}
              className="underline-offset-2 hover:underline"
              style={{ color: accent }}
            >
              Caja
            </a>
            .
          </p>
        ) : null}
      </div>

      {cliente ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${accent}4d`,
                  backgroundColor: `${accent}1a`,
                }}
              >
                <UserRound className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-space)] text-xl font-bold">
                  {cliente.nombre}
                </p>
                <p className="mt-0.5 text-sm text-white/45">{cliente.telefono}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p
                    className="inline-flex rounded-full border px-3 py-1 text-sm font-semibold"
                    style={{
                      borderColor: `${accent}4d`,
                      backgroundColor: `${accent}1a`,
                      color: accent,
                    }}
                  >
                    {formatPuntos(cliente.puntos)} puntos
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCanjeOpen((v) => !v);
                      setCanjeError(null);
                      setCanjeOk(null);
                    }}
                    disabled={cliente.puntos <= 0}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: `${accent}66`,
                      backgroundColor: `${accent}1a`,
                      color: accent,
                    }}
                  >
                    <Gift className="h-3.5 w-3.5" />
                    Canjear puntos
                  </button>
                </div>
              </div>
            </div>

            {canjeOpen ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white/80">
                    ¿Cuántos puntos canjear? · 1 pt = $1 MXN (decimales OK)
                  </p>
                  <button
                    type="button"
                    onClick={() => setCanjeOpen(false)}
                    className="rounded-lg p-1 text-white/40 hover:text-white"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <label className={loyaltyLabelClass()} htmlFor="puntos-canje">
                  Puntos (máx. {formatPuntos(cliente.puntos)})
                </label>
                <input
                  id="puntos-canje"
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={cliente.puntos}
                  step={0.1}
                  placeholder="Ej. 1.5"
                  value={puntosCanje}
                  onChange={(e) => setPuntosCanje(e.target.value)}
                  className={loyaltyInputClass()}
                />
                {Number(puntosCanje) > 0 ? (
                  <p className="mt-2 text-xs text-white/50">
                    Descuento:{' '}
                    <strong style={{ color: accent }}>
                      {formatMxn(roundPuntos(Number(puntosCanje)) || 0)}
                    </strong>
                  </p>
                ) : null}
                {canjeError ? <p className="mt-2 text-sm text-red-400">{canjeError}</p> : null}
                <button
                  type="button"
                  onClick={() => void confirmarCanje()}
                  disabled={canjeLoading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {canjeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                  Confirmar canje
                </button>
              </div>
            ) : null}

            {canjeOk ? (
              <div
                className="mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: `${accent}4d`,
                  backgroundColor: `${accent}14`,
                }}
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                <p className="text-sm text-white/85">{canjeOk}</p>
              </div>
            ) : null}

            <div className="mt-6">
              <WalletButton cliente={cliente} tenantId={tenantId} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-white/70">
              <History className="h-4 w-4" style={{ color: accent }} />
              <h2 className="font-[family-name:var(--font-space)] text-sm font-semibold">
                Últimos movimientos
              </h2>
            </div>
            {ultimas.length === 0 ? (
              <p className="text-sm text-white/40">Sin historial aún.</p>
            ) : (
              <ul className="space-y-2">
                {ultimas.map((h, i) => {
                  const esCanje = h.tipo === 'canje';
                  const esContacto = h.tipo === 'contacto_reactivacion';
                  if (esContacto) {
                    return (
                      <li
                        key={`${h.fecha}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            Contacto de reactivación
                            {h.plantilla ? ` · ${h.plantilla}` : ''}
                          </p>
                          <p className="text-xs text-white/40">{formatFecha(h.fecha)}</p>
                        </div>
                        <span className="shrink-0 text-xs text-white/40">WhatsApp</span>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={`${h.fecha}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {esCanje
                            ? `Canje · ${formatMxn(h.monto)} descuento`
                            : formatMxn(h.monto)}
                        </p>
                        <p className="text-xs text-white/40">{formatFecha(h.fecha)}</p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold ${
                          esCanje ? 'text-red-400' : ''
                        }`}
                        style={esCanje ? undefined : { color: accent }}
                      >
                        {esCanje
                          ? `−${formatPuntos(h.puntosGanados)}`
                          : `+${formatPuntos(h.puntosGanados)}`}{' '}
                        pts
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
