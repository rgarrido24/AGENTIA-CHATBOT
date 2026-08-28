import type { ReactNode } from 'react';
import CarnitasAuthGuard from '../CarnitasAuthGuard';

export default function CarnitasCajaLayout({ children }: { children: ReactNode }) {
  return <CarnitasAuthGuard from="/carnitas/caja">{children}</CarnitasAuthGuard>;
}
