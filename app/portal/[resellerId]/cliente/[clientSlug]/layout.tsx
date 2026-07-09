import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
};

export default function PortalClientLayout({ children }: { children: React.ReactNode }) {
  return children;
}
