import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'CWF Panel',
  description: 'Panel CWF México — conversaciones y cotizaciones',
  manifest: '/cwf-panel/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CWF Panel',
  },
  icons: {
    icon: [{ url: '/pwa/cwf/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/pwa/cwf/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1208',
};

export default function CwfPanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
