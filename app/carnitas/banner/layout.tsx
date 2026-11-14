import type { ReactNode } from 'react';
import CarnitasAuthGuard from '../CarnitasAuthGuard';

export default function CarnitasBannerLayout({ children }: { children: ReactNode }) {
  return <CarnitasAuthGuard from="/carnitas/banner">{children}</CarnitasAuthGuard>;
}
