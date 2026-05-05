'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import AddClientModal from './AddClientModal';
import ClientsList from './ClientsList';
import { useLucianoPortalThemeOptional } from './LucianoPortalTheme';
import { LUCINO_PRODUCT_TITLE } from '@/lib/portal-luciano-ui';

export type DashboardClientRow = {
  clientSlug: string;
  nombre: string;
  negocio: string;
  status: string;
  leadsHoy: number;
  total: number;
};

type Props = {
  resellerId: string;
  brandLogo: string | null | undefined;
  brandName: string | null | undefined;
  brandColor: string | null | undefined;
  nombre: string;
  statsHoy: number;
  statsSemana: number;
  statsMes: number;
  clients: DashboardClientRow[];
};

export default function DashboardView({
  resellerId,
  brandLogo,
  brandName,
  brandColor,
  nombre,
  statsHoy,
  statsSemana,
  statsMes,
  clients,
}: Props) {
  const ctx = useLucianoPortalThemeOptional();
  const light = ctx?.light ?? false;
  const isLuciano = ctx?.isLuciano ?? false;
  const toggleTheme = ctx?.toggleTheme;

  const accent = brandColor ?? '#22c55e';
  const pageBg = light ? '#f1f5f9' : '#000';
  const headerBg = light ? 'rgba(255,255,255,0.92)' : '#000';
  const headerBorder = light ? 'rgba(15,23,42,0.08)' : '#1a1a1a';
  const brandLine = light ? '#0f766e' : accent;
  const titleWhite = light ? '#0f172a' : '#fff';
  const muted = light ? '#64748b' : '#555';
  const statCardBg = light ? '#ffffff' : '#0d0d0d';
  const statBorder = light ? 'rgba(15,23,42,0.08)' : '#1e1e1e';
  const statNum = light ? '#0d9488' : '#22c55e';
  const logoutBg = light ? '#f1f5f9' : '#111';
  const logoutColor = light ? '#475569' : '#555';
  const logoutBorder = light ? '#cbd5e1' : '#222';

  const headerProductLabel = isLuciano ? LUCINO_PRODUCT_TITLE : brandName ?? 'Portal Agentia';

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <header
        className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md"
        style={{ background: headerBg, borderColor: headerBorder }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src={brandLogo ?? '/logo-agentia-2026.png'}
              alt={headerProductLabel}
              width={32}
              height={32}
              className="rounded-lg object-contain shrink-0"
              style={{
                background: light ? '#f8fafc' : '#111',
                padding: 2,
                border: light ? '1px solid rgba(15,23,42,0.08)' : undefined,
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: brandLine }}>
                {headerProductLabel}
              </p>
              <p className="text-sm font-bold truncate" style={{ color: titleWhite }}>
                {nombre}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLuciano && toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-90"
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
            <a
              href={`/api/portal/auth/logout?resellerId=${resellerId}`}
              className="text-xs px-3 py-1.5 rounded-lg transition"
              style={{
                background: logoutBg,
                color: logoutColor,
                border: `1px solid ${logoutBorder}`,
              }}
            >
              Cerrar sesión
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3 text-xs">
          <span
            className="px-3 py-2 rounded-lg border shadow-sm font-semibold"
            style={{ background: isLuciano && light ? '#CCFF00' : statCardBg, borderColor: statBorder, color: isLuciano && light ? '#000' : titleWhite }}
          >
            Dashboard
          </span>
          <Link
            href={`/portal/${resellerId}/clientes`}
            className="px-3 py-2 rounded-lg border shadow-sm"
            style={{ background: statCardBg, borderColor: statBorder, color: titleWhite }}
          >
            Mis clientes
          </Link>
          <Link
            href={`/portal/${resellerId}/brief`}
            className="px-3 py-2 rounded-lg border shadow-sm"
            style={{ background: statCardBg, borderColor: statBorder, color: titleWhite }}
          >
            Brief Digital
          </Link>
        </div>
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: muted }}>
            Resumen global
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Leads hoy', value: statsHoy },
              { label: 'Esta semana', value: statsSemana },
              { label: 'Este mes', value: statsMes },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-4 text-center border shadow-sm"
                style={{ background: statCardBg, borderColor: statBorder }}
              >
                <p className="text-2xl font-extrabold" style={{ color: statNum }}>
                  {value}
                </p>
                <p className="text-[10px] mt-1" style={{ color: muted }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: muted }}>
              Mis clientes
            </p>
            <div className="flex items-center gap-3">
              <AddClientModal resellerId={resellerId} />
              <Link href={`/portal/${resellerId}/clientes`} className="text-xs" style={{ color: muted }}>
                Ver todos →
              </Link>
            </div>
          </div>

          <ClientsList resellerId={resellerId} clients={clients} />
        </div>
      </main>
    </div>
  );
}
