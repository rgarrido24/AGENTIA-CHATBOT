import type { Metadata } from 'next';
import { buildIzziMetadata } from '@/lib/izzi-metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = buildIzziMetadata({
  title: '150 Mbps — $459 de por vida | Izzi Mérida',
  description:
    'Internet Residencial 150 Mbps en Mérida. 1er mes $100, $459 de por vida. Incluye ViX Premium 6 meses y Max 12 meses. Instalación sin costo.',
  path: '/izzi/merida/150',
});

export default function IzziMerida150Layout({ children }: { children: React.ReactNode }) {
  return children;
}
