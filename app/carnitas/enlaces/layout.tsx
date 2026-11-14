import type { ReactNode } from 'react';
import CarnitasAuthGuard from '../CarnitasAuthGuard';

export default function CarnitasEnlacesLayout({ children }: { children: ReactNode }) {
  return <CarnitasAuthGuard from="/carnitas/enlaces">{children}</CarnitasAuthGuard>;
}
