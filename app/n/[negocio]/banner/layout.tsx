import type { ReactNode } from 'react';
import TenantAuthGuard from '../TenantAuthGuard';

type Props = { children: ReactNode; params: { negocio: string } };

export default function BannerLayout({ children, params }: Props) {
  return (
    <TenantAuthGuard negocio={params.negocio} seccion="banner">
      {children}
    </TenantAuthGuard>
  );
}
