import type { ReactNode } from 'react';

export const metadata = {
  title: 'Portal Luciano Puntillo',
  openGraph: {
    images: ['/luciano-og-image.jpg'],
  },
};

export default function LucianoPortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
