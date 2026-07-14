import type { Metadata, Viewport } from 'next';
import { PortalClientShell } from './PortalClientShell';

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mis Leads — Panel de asesoras',
    description: 'Gestión de leads en tiempo real',
    // Sin manifest / apple-web-app: evita prompts de instalación en iOS/Android.
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
