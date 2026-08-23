import type { ReactNode } from 'react';
import SabucanAuthGuard from '../SabucanAuthGuard';

export default function SabucanClientesLayout({ children }: { children: ReactNode }) {
  return <SabucanAuthGuard from="/sabucan/clientes">{children}</SabucanAuthGuard>;
}
