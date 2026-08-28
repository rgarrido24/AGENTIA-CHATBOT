import type { ReactNode } from 'react';
import CarnitasAuthGuard from '../CarnitasAuthGuard';

export default function CarnitasBuscarLayout({ children }: { children: ReactNode }) {
  return <CarnitasAuthGuard from="/carnitas/buscar">{children}</CarnitasAuthGuard>;
}
