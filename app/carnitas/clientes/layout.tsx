import type { ReactNode } from 'react';
import CarnitasAuthGuard from '../CarnitasAuthGuard';

export default function CarnitasClientesLayout({ children }: { children: ReactNode }) {
  return <CarnitasAuthGuard from="/carnitas/clientes">{children}</CarnitasAuthGuard>;
}
