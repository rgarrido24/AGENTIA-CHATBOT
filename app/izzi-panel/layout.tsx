import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { IzziPanelShell } from './IzziPanelShell';
import { IZZI_PANEL_COOKIE, resolveIzziPanelClientIdFromCookie } from '@/lib/izzi-panel-auth';
import { izziPanelBrand } from '@/lib/izzi-panel-brand';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const clientId = resolveIzziPanelClientIdFromCookie(cookieStore.get(IZZI_PANEL_COOKIE)?.value);
  const brand = izziPanelBrand(clientId);
  return {
    title: brand.pwaName,
    description: brand.pwaDescription,
    manifest: brand.manifestPath,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: brand.shortName,
    },
    icons: {
      icon: [{ url: `${brand.iconBase}/icon-192.png`, sizes: '192x192', type: 'image/png' }],
      apple: [{ url: brand.appleIcon, sizes: '180x180', type: 'image/png' }],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  const clientId = resolveIzziPanelClientIdFromCookie(cookieStore.get(IZZI_PANEL_COOKIE)?.value);
  return { themeColor: izziPanelBrand(clientId).bg };
}

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
