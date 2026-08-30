import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Agentia Panel',
  description: 'Panel de conversaciones Agentia',
  manifest: '/agentia-panel/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Agentia Panel',
  },
  icons: {
    icon: [{ url: '/pwa/agentia/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/pwa/agentia/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
};

export default function AgentiaPanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
