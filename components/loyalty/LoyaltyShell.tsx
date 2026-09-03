'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { Search, ShoppingCart, Users } from 'lucide-react';
import { getTenant, type TenantId } from '@/lib/wallet-tenant';

type Props = {
  tenantId: TenantId;
  children: ReactNode;
};

export function LoyaltyShell({ tenantId, children }: Props) {
  const tenant = getTenant(tenantId);
  const [logoOk, setLogoOk] = useState(true);

  if (!tenant) return null;

  const { nombre, logoUrl, colorPrimario, colorAcento, basePath } = tenant;
  const initial = nombre.trim().charAt(0).toUpperCase() || '?';
  const isCarnitas = tenantId === 'carnitas_granada';

  const nav = [
    { href: `${basePath}/caja`, label: 'Caja', icon: ShoppingCart },
    { href: `${basePath}/buscar`, label: 'Buscar', icon: Search },
    { href: `${basePath}/clientes`, label: 'Clientes', icon: Users },
  ] as const;

  const rootStyle = {
    backgroundColor: colorPrimario,
    '--loyalty-primary': colorPrimario,
    '--loyalty-accent': colorAcento,
  } as CSSProperties;

  return (
    <div
      className="min-h-screen text-white font-[family-name:var(--font-inter)]"
      style={rootStyle}
    >
      <header
        className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl"
        style={{ backgroundColor: `${colorPrimario}e6` }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={`${basePath}/caja`} className="flex min-w-0 items-center gap-2.5">
            {isCarnitas ? (
              <span
                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden"
                aria-hidden
              >
                {logoOk ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full object-contain"
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-sm font-bold"
                    style={{ color: colorAcento }}
                  >
                    {initial}
                  </span>
                )}
              </span>
            ) : (
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: `${colorAcento}66` }}
                aria-hidden
              >
                {logoOk ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full object-contain p-0.5"
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-sm font-bold"
                    style={{ color: colorAcento, backgroundColor: colorPrimario }}
                  >
                    {initial}
                  </span>
                )}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-space)] text-sm font-bold tracking-wide">
                {nombre}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                Caja · Lealtad
                {tenant.isDemo ? ' · Demo' : ''}
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap justify-end gap-1.5">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/75 transition-colors hover:border-[color:var(--loyalty-accent)]/60 hover:text-[color:var(--loyalty-accent)] sm:px-3"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
