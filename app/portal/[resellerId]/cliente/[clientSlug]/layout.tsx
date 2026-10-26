import type { Metadata, Viewport } from 'next';
import { PortalClientShell } from './PortalClientShell';

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
};

export async function generateMetadata({
  params,
}: {
  params: { resellerId: string; clientSlug: string };
}): Promise<Metadata> {
  return {
    title: 'Mis Leads — Panel de asesoras',
    description: 'Gestión de leads en tiempo real',
    // Con manifest Chrome ofrece "Instalar app" (PWA real) y no solo "acceso directo".
    manifest: `/portal/${params.resellerId}/cliente/${params.clientSlug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: 'Mis Leads', statusBarStyle: 'default' },
  };
}

/**
 * Layout del portal de asesoras.
 * Sin PWA agresiva: carga directa. La campana es opcional y voluntaria.
 */
export default function PortalClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { resellerId: string; clientSlug: string };
}) {
  return (
    <>
      <PortalClientShell
        resellerId={params.resellerId}
        clientSlug={params.clientSlug}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      />
      {children}
    </>
  );
}
