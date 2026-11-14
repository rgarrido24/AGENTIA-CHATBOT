import type { ReactNode } from 'react';
import TenantAuthGuard from '../TenantAuthGuard';

type Props = { children: ReactNode; params: { negocio: string } };

export default function DemoBuscarLayout({ children, params }: Props) {
  return (
    <TenantAuthGuard negocio={params.negocio} seccion="buscar">
      {children}
    </TenantAuthGuard>
  );
}
