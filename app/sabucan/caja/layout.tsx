import type { ReactNode } from 'react';
import SabucanAuthGuard from '../SabucanAuthGuard';

export default function SabucanCajaLayout({ children }: { children: ReactNode }) {
  return <SabucanAuthGuard from="/sabucan/caja">{children}</SabucanAuthGuard>;
}
