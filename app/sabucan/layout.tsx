import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SABUCAN_NAVY } from '@/lib/sabucan-brand';
import { SabucanHeader } from './SabucanHeader';

export const metadata: Metadata = {
  title: 'SABUCAN · Caja de lealtad',
  description: 'Registro de ventas y puntos SABUCAN',
  robots: { index: false, follow: false },
};

export default function SabucanLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen text-white font-[family-name:var(--font-inter)]"
      style={{ backgroundColor: SABUCAN_NAVY }}
    >
      <SabucanHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
