import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LoyaltyShell } from '@/components/loyalty/LoyaltyShell';

export const metadata: Metadata = {
  title: 'Carnitas Granada · Caja de lealtad',
  description: 'Registro de ventas y cashback en puntos — Carnitas Granada',
  robots: { index: false, follow: false },
};

export default function CarnitasLayout({ children }: { children: ReactNode }) {
  return <LoyaltyShell tenantId="carnitas_granada">{children}</LoyaltyShell>;
}
