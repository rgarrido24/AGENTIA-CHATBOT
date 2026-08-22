import type { ReactNode } from 'react';
import SabucanAuthGuard from '../SabucanAuthGuard';

export default function SabucanBuscarLayout({ children }: { children: ReactNode }) {
  return <SabucanAuthGuard from="/sabucan/buscar">{children}</SabucanAuthGuard>;
}
