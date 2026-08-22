import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SABUCAN · Caja de lealtad',
  description: 'Registro de ventas y puntos SABUCAN',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/sabucan/caja', label: 'Caja', icon: ShoppingCart },
  { href: '/sabucan/buscar', label: 'Buscar cliente', icon: Search },
] as const;

export default function SabucanLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-[family-name:var(--font-inter)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/sabucan/caja" className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00D4FF]/35 bg-[#00D4FF]/10 font-[family-name:var(--font-space)] text-sm font-bold text-[#00D4FF]"
              aria-hidden
            >
              S
            </span>
            <div>
              <p className="font-[family-name:var(--font-space)] text-sm font-bold tracking-wide">
                SABUCAN
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Caja · Lealtad</p>
            </div>
          </Link>
          <nav className="flex gap-1.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-[#00D4FF]/40 hover:text-[#00D4FF]"
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
