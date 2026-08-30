import type { Metadata, Viewport } from 'next';
import { IzziPanelShell } from './IzziPanelShell';

export const metadata: Metadata = {
  title: 'izzi Panel',
  description: 'Panel izzi — conversaciones WhatsApp, ventas y reclutamiento',
  manifest: '/izzi-panel/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'izzi Panel',
  },
  icons: {
    icon: [{ url: '/pwa/izzi/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/pwa/izzi/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#140810',
};

export default function IzziPanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IzziPanelShell />
      {children}
    </>
  );
}
