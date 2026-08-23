'use client';

import Link from 'next/link';
import { Search, ShoppingCart, Users } from 'lucide-react';
import { useState } from 'react';
import { SABUCAN_LOGO_URL, SABUCAN_NAVY, SABUCAN_ORANGE } from '@/lib/sabucan-brand';

const NAV = [
  { href: '/sabucan/caja', label: 'Caja', icon: ShoppingCart },
  { href: '/sabucan/buscar', label: 'Buscar', icon: Search },
  { href: '/sabucan/clientes', label: 'Clientes', icon: Users },
] as const;

export function SabucanHeader() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl"
      style={{ backgroundColor: `${SABUCAN_NAVY}e6` }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/sabucan/caja" className="flex min-w-0 items-center gap-2.5">
          <span
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: `${SABUCAN_ORANGE}66` }}
            aria-hidden
          >
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={SABUCAN_LOGO_URL}
                alt=""
                className="h-full w-full object-contain p-0.5"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-sm font-bold"
                style={{ color: SABUCAN_ORANGE, backgroundColor: SABUCAN_NAVY }}
              >
                S
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-space)] text-sm font-bold tracking-wide">
              SABUCAN
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Caja · Lealtad</p>
          </div>
        </Link>
        <nav className="flex flex-wrap justify-end gap-1.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/75 transition-colors hover:border-[#F2691F]/60 hover:text-[#F2691F] sm:px-3"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
