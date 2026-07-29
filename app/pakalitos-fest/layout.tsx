import type { Metadata } from 'next';
import { LudotecaProvider } from '@/lib/pakalitos-fest/store';
import './pakalitos.css';

export const metadata: Metadata = {
  title: 'Pakalitos Fest · Recepción',
  description: 'Check-in, membresías y lealtad en un solo flujo',
};

export default function PakalitosLayout({ children }: { children: React.ReactNode }) {
  return (
    <LudotecaProvider>
      <div className="pakalitos-shell min-h-[100dvh]">{children}</div>
    </LudotecaProvider>
  );
}
