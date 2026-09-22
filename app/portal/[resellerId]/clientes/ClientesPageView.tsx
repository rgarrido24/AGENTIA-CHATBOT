'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Moon, Sun, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { useLucianoPortalThemeOptional } from '../dashboard/LucianoPortalTheme';
import { LUCINO_PRODUCT_TITLE } from '@/lib/portal-luciano-ui';
import { FacebookConnectBanners, FbConnectLink, FbConnectionBadge } from './FacebookConnectUi';

export type ClienteRow = {
  clientSlug: string;
  nombre: string;
  negocio: string;
  status: string;
  activeForms: number;
  alertNumber: string;
  fbStatus: 'pending' | 'connected';
  fbNative?: boolean;
  leadsHoy: number;
  leadsMes: number;
  total: number;
};

type Props = {
  resellerId: string;
  brandLogo: string | null | undefined;
  brandName: string | null | undefined;
  nombre: string;
  rows: ClienteRow[];
  fbError?: string;
  fbJustConnected?: boolean;
};

type SortKey = 'az' | 'za' | 'hoy' | 'mes' | 'total';
type HoyChip = 'with' | 'without' | null;
type StatusChip = 'activo' | 'suspendido' | null;

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function filterAndSortRows(
  rows: ClienteRow[],
  opts: {
    query: string;
    sort: SortKey;
    hoy: HoyChip;
    status: StatusChip;
    fbPending: boolean;
    noAlert: boolean;
  },
): ClienteRow[] {
  const q = fold(opts.query.trim());
  const filtered = rows.filter((c) => {
    if (q) {
      const hay = fold(`${c.nombre} ${c.negocio} ${c.clientSlug}`);
      if (!hay.includes(q)) return false;
    }
    if (opts.hoy === 'with' && c.leadsHoy <= 0) return false;
    if (opts.hoy === 'without' && c.leadsHoy > 0) return false;
    if (opts.status && c.status !== opts.status) return false;
    if (opts.fbPending && c.fbNative) return false;
    if (opts.noAlert && c.alertNumber.trim()) return false;
    return true;
  });

  const byName = (a: ClienteRow, b: ClienteRow) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });

  return filtered.sort((a, b) => {
    if (opts.sort === 'za') return byName(b, a);
    if (opts.sort === 'hoy') return b.leadsHoy - a.leadsHoy || byName(a, b);
    if (opts.sort === 'mes') return b.leadsMes - a.leadsMes || byName(a, b);
    if (opts.sort === 'total') return b.total - a.total || byName(a, b);
    return byName(a, b);
  });
}

export default function ClientesPageView({
  resellerId,
  brandLogo,
  brandName,
  nombre,
  rows,
  fbError,
  fbJustConnected,
}: Props) {
  const router = useRouter();
  const ctx = useLucianoPortalThemeOptional();
  const light = ctx?.light ?? false;
  const isLuciano = ctx?.isLuciano ?? false;
  const toggleTheme = ctx?.toggleTheme;
  const [alertEdit, setAlertEdit] = useState<{ slug: string; nombre: string; value: string } | null>(null);
  const [savingAlert, setSavingAlert] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('az');
  const [hoy, setHoy] = useState<HoyChip>(null);
  const [status, setStatus] = useState<StatusChip>(null);
  const [fbPending, setFbPending] = useState(false);
  const [noAlert, setNoAlert] = useState(false);

  const visible = useMemo(
    () => filterAndSortRows(rows, { query, sort, hoy, status, fbPending, noAlert }),
    [rows, query, sort, hoy, status, fbPending, noAlert],
  );
  const filtersOn = Boolean(query.trim() || hoy || status || fbPending || noAlert || sort !== 'az');

  const pageBg = light ? '#f1f5f9' : '#000';
  const headerBg = light ? 'rgba(255,255,255,0.92)' : '#000';
  const headerBorder = light ? 'rgba(15,23,42,0.08)' : '#1a1a1a';
  const backColor = light ? '#0d9488' : '#555';
  const logoBg = light ? '#f8fafc' : '#111';
  const titleColor = light ? '#0f172a' : '#fff';
  const subtitleColor = light ? '#64748b' : '#94a3b8';
  const emptyColor = light ? '#64748b' : '#444';
  const cardBg = light ? '#ffffff' : '#0d0d0d';
  const cardBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const nameColor = light ? '#0f172a' : '#fff';
  const negocioColor = light ? '#64748b' : '#555';
  const formsColor = light ? '#94a3b8' : '#444';
  const hoyColor = light ? '#0d9488' : '#22c55e';
  const hoyLabel = light ? '#94a3b8' : '#444';
  const mesColor = light ? '#0f172a' : '#fff';
  const totalMuted = light ? '#64748b' : '#666';
  const totalLabel = light ? '#94a3b8' : '#333';
  const activoBg = light ? '#ecfdf5' : '#0d2200';
  const activoColor = light ? '#047857' : '#22c55e';
  const suspendBg = light ? '#fef2f2' : '#1a0000';
  const suspendColor = light ? '#b91c1c' : '#ef4444';

  const headerLine = isLuciano ? LUCINO_PRODUCT_TITLE : brandName ?? 'Portal';

  async function saveAlertNumber() {
    if (!alertEdit) return;
    setSavingAlert(true);
    try {
      const res = await fetch(`/api/portal/${resellerId}/client/${alertEdit.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertNumber: alertEdit.value.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error || 'No se pudo guardar');
        return;
      }
      setAlertEdit(null);
      router.refresh();
    } finally {
      setSavingAlert(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <header
        className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md"
        style={{ background: headerBg, borderColor: headerBorder }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href={`/portal/${resellerId}/dashboard`} className="text-xs shrink-0 font-medium" style={{ color: backColor }}>
              ← Dashboard
            </Link>
            <div className="flex items-center gap-2 min-w-0 ml-1">
              <Image
                src={brandLogo ?? '/logo-agentia-2026.png'}
                alt={headerLine}
                width={24}
                height={24}
                className="rounded object-contain shrink-0"
                style={{
                  background: logoBg,
                  border: light ? '1px solid rgba(15,23,42,0.08)' : undefined,
                }}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: isLuciano && light ? '#0f766e' : isLuciano ? '#CCFF00' : '#22c55e' }}>
                  {headerLine}
                </p>
                <p className="text-sm font-bold truncate" style={{ color: titleColor }}>
                  Mis clientes · {nombre}
                </p>
              </div>
            </div>
          </div>
          {isLuciano && toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-90"
              style={{
                background: light ? '#ffffff' : '#111',
                borderColor: light ? 'rgba(15,23,42,0.12)' : '#222',
                color: light ? '#0f172a' : '#e2e8f0',
              }}
              aria-label={light ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              {light ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 text-xs mb-5">
          <Link
            href={`/portal/${resellerId}/dashboard`}
            className="px-3 py-2 rounded-lg border shadow-sm"
            style={{ background: cardBg, borderColor: cardBorder, color: titleColor }}
          >
            Dashboard
          </Link>
          <span
            className="px-3 py-2 rounded-lg border shadow-sm font-semibold"
            style={{ background: isLuciano && light ? '#CCFF00' : cardBg, borderColor: cardBorder, color: isLuciano && light ? '#000' : titleColor }}
          >
            Mis clientes
          </span>
          <Link
            href={`/portal/${resellerId}/brief`}
            className="px-3 py-2 rounded-lg border shadow-sm"
            style={{ background: cardBg, borderColor: cardBorder, color: titleColor }}
          >
            Brief Digital
          </Link>
        </div>
        <FacebookConnectBanners
          resellerId={resellerId}
          fbError={fbError}
          fbJustConnected={fbJustConnected}
        />
        {rows.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: emptyColor }}>No tienes clientes registrados.</p>
            <p className="text-xs mt-2" style={{ color: subtitleColor }}>Creá uno desde el dashboard.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <ClientesToolbar
              light={light}
              isLuciano={isLuciano}
              query={query}
              sort={sort}
              hoy={hoy}
              status={status}
              fbPending={fbPending}
              noAlert={noAlert}
              filtersOn={filtersOn}
              shown={visible.length}
              total={rows.length}
              onQuery={setQuery}
              onSort={setSort}
              onHoy={setHoy}
              onStatus={setStatus}
              onFbPending={setFbPending}
              onNoAlert={setNoAlert}
              onClear={() => {
                setQuery('');
                setSort('az');
                setHoy(null);
                setStatus(null);
                setFbPending(false);
                setNoAlert(false);
              }}
            />
            {alertEdit && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="clientes-alert-title"
              >
                <div
                  className="w-full max-w-sm rounded-xl border p-4 shadow-xl"
                  style={{ background: cardBg, borderColor: cardBorder }}
                >
                  <p id="clientes-alert-title" className="text-sm font-bold" style={{ color: nameColor }}>
                    WhatsApp — alertas de leads (Zapier / Meta)
                  </p>
                  <p className="text-xs mt-1" style={{ color: negocioColor }}>
                    {alertEdit.nombre}
                  </p>
                  <input
                    className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: light ? '#f8fafc' : '#0d0d0d',
                      borderColor: cardBorder,
                      color: nameColor,
                    }}
                    placeholder="Ej. 5493518354796"
                    value={alertEdit.value}
                    onChange={(e) => setAlertEdit({ ...alertEdit, value: e.target.value })}
                  />
                  <p className="text-[10px] mt-2" style={{ color: formsColor }}>
                    Déjalo vacío para usar solo la variable del servidor (FB_ALERT_NUMBER). Con número, las alertas de los formularios de este cliente van a ese WhatsApp.
                  </p>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-xs"
                      style={{ background: light ? '#e2e8f0' : '#222', color: nameColor }}
                      onClick={() => setAlertEdit(null)}
                      disabled={savingAlert}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: isLuciano && light ? '#CCFF00' : '#22c55e',
                        color: isLuciano && light ? '#000' : '#fff',
                      }}
                      onClick={() => void saveAlertNumber()}
                      disabled={savingAlert}
                    >
                      {savingAlert ? '…' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {visible.length === 0 ? (
              <div className="rounded-xl border px-4 py-10 text-center" style={{ background: cardBg, borderColor: cardBorder }}>
                <p className="text-sm" style={{ color: emptyColor }}>Ningún cliente coincide con la búsqueda.</p>
                <button
                  type="button"
                  className="text-xs mt-2 underline"
                  style={{ color: hoyColor }}
                  onClick={() => {
                    setQuery('');
                    setSort('az');
                    setHoy(null);
                    setStatus(null);
                    setFbPending(false);
                    setNoAlert(false);
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
            visible.map((c) => (
              <div
                key={c.clientSlug}
                className="rounded-xl border p-4 transition shadow-sm"
                style={{ background: cardBg, borderColor: cardBorder }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/portal/${resellerId}/cliente/${c.clientSlug}`} className="font-semibold hover:underline" style={{ color: nameColor }}>
                        {c.nombre}
                      </Link>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={c.status === 'activo'
                          ? { background: activoBg, color: activoColor }
                          : { background: suspendBg, color: suspendColor }}
                      >
                        {c.status}
                      </span>
                      <FbConnectionBadge status={c.fbStatus ?? 'pending'} light={light} />
                      <FbConnectLink
                        resellerId={resellerId}
                        clientSlug={c.clientSlug}
                        connected={!!c.fbNative}
                        light={light}
                      />
                      <button
                        type="button"
                        title="Número WhatsApp para alertas"
                        className="text-[10px] font-semibold rounded-lg px-2 py-0.5"
                        style={{
                          background: light ? '#ecfdf5' : '#0d2200',
                          color: hoyColor,
                          border: `1px solid ${light ? '#a7f3d0' : '#14532d'}`,
                        }}
                        onClick={() => setAlertEdit({ slug: c.clientSlug, nombre: c.nombre, value: c.alertNumber })}
                      >
                        Alertas
                      </button>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: negocioColor }}>{c.negocio}</p>
                    <p className="text-xs mt-1.5" style={{ color: formsColor }}>
                      {c.activeForms} formulario(s) activo(s)
                      {c.alertNumber ? ` · alerta: ${c.alertNumber}` : ' · alerta: FB_ALERT_NUMBER'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <div>
                      <span className="text-sm font-bold" style={{ color: hoyColor }}>{c.leadsHoy}</span>
                      <span className="text-[10px] ml-1" style={{ color: hoyLabel }}>hoy</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: mesColor }}>{c.leadsMes}</span>
                      <span className="text-[10px] ml-1" style={{ color: hoyLabel }}>mes</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: totalMuted }}>{c.total}</span>
                      <span className="text-[10px] ml-1" style={{ color: totalLabel }}>total</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

type ToolbarProps = {
  light: boolean;
  isLuciano: boolean;
  query: string;
  sort: SortKey;
  hoy: HoyChip;
  status: StatusChip;
  fbPending: boolean;
  noAlert: boolean;
  filtersOn: boolean;
  shown: number;
  total: number;
  onQuery: (v: string) => void;
  onSort: (v: SortKey) => void;
  onHoy: (v: HoyChip) => void;
  onStatus: (v: StatusChip) => void;
  onFbPending: (v: boolean) => void;
  onNoAlert: (v: boolean) => void;
  onClear: () => void;
};

function Chip({
  active,
  light,
  isLuciano,
  onClick,
  children,
}: {
  active: boolean;
  light: boolean;
  isLuciano: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-semibold rounded-full px-2.5 py-1 border transition"
      style={
        active
          ? {
              background: isLuciano && light ? '#CCFF00' : '#22c55e',
              color: '#000',
              borderColor: isLuciano && light ? '#CCFF00' : '#22c55e',
            }
          : {
              background: light ? '#ffffff' : '#111',
              color: light ? '#475569' : '#94a3b8',
              borderColor: light ? 'rgba(15,23,42,0.12)' : '#2a2a2a',
            }
      }
    >
      {children}
    </button>
  );
}

function ClientesToolbar({
  light,
  isLuciano,
  query,
  sort,
  hoy,
  status,
  fbPending,
  noAlert,
  filtersOn,
  shown,
  total,
  onQuery,
  onSort,
  onHoy,
  onStatus,
  onFbPending,
  onNoAlert,
  onClear,
}: ToolbarProps) {
  const cardBg = light ? '#ffffff' : '#0d0d0d';
  const cardBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const titleColor = light ? '#0f172a' : '#fff';
  const muted = light ? '#64748b' : '#94a3b8';
  const inputBg = light ? '#f8fafc' : '#111';

  return (
    <div className="rounded-xl border p-3 mb-3 shadow-sm space-y-2.5" style={{ background: cardBg, borderColor: cardBorder }}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar por nombre o negocio…"
            className="w-full rounded-lg border pl-8 pr-8 py-2 text-sm outline-none"
            style={{ background: inputBg, borderColor: cardBorder, color: titleColor }}
            aria-label="Buscar clientes"
          />
          {query && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: muted }}
              onClick={() => onQuery('')}
              aria-label="Borrar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="shrink-0 rounded-lg border px-2 py-2 text-xs outline-none"
          style={{ background: inputBg, borderColor: cardBorder, color: titleColor }}
          aria-label="Ordenar clientes"
        >
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
          <option value="hoy">Más leads hoy</option>
          <option value="mes">Más leads mes</option>
          <option value="total">Más leads total</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={hoy === 'with'} light={light} isLuciano={isLuciano} onClick={() => onHoy(hoy === 'with' ? null : 'with')}>
          Con leads hoy
        </Chip>
        <Chip active={hoy === 'without'} light={light} isLuciano={isLuciano} onClick={() => onHoy(hoy === 'without' ? null : 'without')}>
          Sin leads hoy
        </Chip>
        <Chip active={fbPending} light={light} isLuciano={isLuciano} onClick={() => onFbPending(!fbPending)}>
          Pendiente Facebook
        </Chip>
        <Chip active={noAlert} light={light} isLuciano={isLuciano} onClick={() => onNoAlert(!noAlert)}>
          Sin alerta WhatsApp
        </Chip>
        <Chip active={status === 'activo'} light={light} isLuciano={isLuciano} onClick={() => onStatus(status === 'activo' ? null : 'activo')}>
          Activo
        </Chip>
        <Chip active={status === 'suspendido'} light={light} isLuciano={isLuciano} onClick={() => onStatus(status === 'suspendido' ? null : 'suspendido')}>
          Suspendido
        </Chip>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px]" style={{ color: muted }}>
          Mostrando {shown} de {total}
        </p>
        {filtersOn && (
          <button type="button" className="text-[11px] font-semibold underline" style={{ color: muted }} onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
