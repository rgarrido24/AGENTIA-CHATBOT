import type { ReactNode } from 'react';
import DemoAuthGuard from '../DemoAuthGuard';

type Props = { children: ReactNode; params: { negocio: string } };

export default function DemoClientesLayout({ children, params }: Props) {
  return (
    <DemoAuthGuard negocio={params.negocio} seccion="clientes">
      {children}
    </DemoAuthGuard>
  );
}
