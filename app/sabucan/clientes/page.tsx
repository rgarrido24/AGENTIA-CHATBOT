'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircle, RefreshCw, Users } from 'lucide-react';
import {
  formatFechaCorta,
  formatPuntos,
  type SabucanClienteUi,
} from '../_components';

type Semaforo = 'verde' | 'amarillo' | 'rojo';

function diasDesde(ultimaVisita: string | null | undefined): number {
  if (!ultimaVisita) return Number.POSITIVE_INFINITY;
  const t = new Date(ultimaVisita).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
}

function semaforo(dias: number): Semaforo {
  if (dias <= 7) return 'verde';
  if (dias <= 15) return 'amarillo';
  return 'rojo';
}

const SEMAFORO_UI: Record<
  Semaforo,
  { label: string; dot: string; badge: string }
> = {
  verde: {
    label: 'Activo',
    dot: 'bg-emerald-400',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  amarillo: {
    label: 'En riesgo',
    dot: 'bg-amber-400',
    badge: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  },
  rojo: {
    label: 'Inactivo',
    dot: 'bg-red-400',
    badge: 'border-red-400/30 bg-red-400/10 text-red-300',
  },
};

function waUrl(telefono: string, nombre: string, puntos: number): string {
  let digits = telefono.replace(/\D/g, '');
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.startsWith('52') && digits.length > 12) digits = digits.slice(-12);
  const first = nombre.trim().split(/\s+/)[0] || 'cliente';
  const text = `Hola ${first}, te extrañamos en SABUCAN, tienes ${formatPuntos(puntos)} puntos esperándote 🛒`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function SabucanClientesPage() {
  const [clientes, setClientes] = useState<SabucanClienteUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sabucan/clientes');
      const json = (await res.json()) as {
        clientes?: SabucanClienteUi[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar');
      setClientes(json.clientes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    return clientes
      .map((c) => {
        const dias = diasDesde(c.ultimaVisita);
        return { cliente: c, dias, sem: semaforo(dias) };
      })
      .sort((a, b) => {
        const da = Number.isFinite(a.dias) ? a.dias : 1e9;
        const db = Number.isFinite(b.dias) ? b.dias : 1e9;
        return db - da;
      });
  }, [clientes]);

  const counts = useMemo(() => {
    const c = { verde: 0, amarillo: 0, rojo: 0 };
    for (const r of rows) c[r.sem] += 1;
    return c;
  }, [rows]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-space)] text-xs font-medium uppercase tracking-[0.2em] text-[#F2691F]">
            Reactivación
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-space)] text-3xl font-bold tracking-tight">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Semáforo de inactividad · contacta primero a los rojos
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30 hover:text-white disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualizar
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {(
          [
            ['verde', '0–7 días'],
            ['amarillo', '8–15 días'],
            ['rojo', '+15 días'],
          ] as const
        ).map(([key, hint]) => (
          <div
            key={key}
            className={`rounded-2xl border px-3 py-3 sm:px-4 ${SEMAFORO_UI[key].badge}`}
          >
            <p className="text-[10px] uppercase tracking-wider opacity-80">{SEMAFORO_UI[key].label}</p>
            <p className="mt-1 font-[family-name:var(--font-space)] text-2xl font-bold">
              {counts[key]}
            </p>
            <p className="mt-0.5 text-[10px] opacity-70">{hint}</p>
          </div>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      {loading && clientes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando clientes…
        </div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <Users className="mx-auto h-8 w-8 text-white/30" />
          <p className="mt-3 text-sm text-white/50">Aún no hay clientes registrados.</p>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map(({ cliente, dias, sem }) => {
            const nombre = cliente.nombreCompleto || cliente.nombre;
            const ui = SEMAFORO_UI[sem];
            const diasLabel = Number.isFinite(dias)
              ? dias === 0
                ? 'Hoy'
                : dias === 1
                  ? '1 día'
                  : `${dias} días`
              : 'Sin visita';

            return (
              <li
                key={cliente.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${ui.dot}`} />
                      <p className="truncate font-[family-name:var(--font-space)] text-base font-semibold">
                        {nombre}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ui.badge}`}
                      >
                        {ui.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/45">{cliente.telefono}</p>
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/50">
                      <div>
                        <dt className="inline text-white/35">Última visita: </dt>
                        <dd className="inline text-white/70">
                          {cliente.ultimaVisita
                            ? formatFechaCorta(cliente.ultimaVisita)
                            : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-white/35">Inactividad: </dt>
                        <dd className="inline text-white/70">{diasLabel}</dd>
                      </div>
                      <div>
                        <dt className="inline text-white/35">Puntos: </dt>
                        <dd className="inline font-semibold text-[#F2691F]">{formatPuntos(cliente.puntos)}</dd>
                      </div>
                    </dl>
                  </div>
                  <a
                    href={waUrl(cliente.telefono, nombre, cliente.puntos)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-[#0a0a0a] transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
