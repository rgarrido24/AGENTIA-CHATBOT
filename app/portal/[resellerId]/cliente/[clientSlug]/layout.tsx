import type { Metadata, Viewport } from 'next';
import {
  PORTAL_PWA_ICON_192,
  PORTAL_PWA_THEME_COLOR,
} from '@/lib/portal-pwa-config';
import { PortalClientShell } from './PortalClientShell';

export const viewport: Viewport = {
  themeColor: PORTAL_PWA_THEME_COLOR,
};

const portalPwaMetadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mis Leads',
  },
  icons: {
    icon: [{ url: PORTAL_PWA_ICON_192, sizes: '192x192', type: 'image/png' }],
    apple: [{ url: PORTAL_PWA_ICON_192, sizes: '192x192', type: 'image/png' }],
  },
};

export async function generateMetadata({
  params,
}: {
  params: { resellerId: string; clientSlug: string };
}): Promise<Metadata> {
  return {
    ...portalPwaMetadata,
    title: 'Mis Leads — Panel de asesoras',
    description: 'Gestión de leads en tiempo real',
  };
}

export default function PortalClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { resellerId: string; clientSlug: string };
}) {
  return (
    <>
      <head>
        <link rel="manifest" href="manifest.webmanifest" />
      </head>
      <PortalClientShell
        resellerId={params.resellerId}
        clientSlug={params.clientSlug}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      />
      {children}
    </>
  );
}
