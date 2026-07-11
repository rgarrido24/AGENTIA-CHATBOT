export const PORTAL_PWA_ICON_192 = '/pwa/portal/icon-192.png';
export const PORTAL_PWA_ICON_512 = '/pwa/portal/icon-512.png';
export const PORTAL_PWA_THEME_COLOR = '#0a0f1a';
export const PORTAL_PWA_BACKGROUND_COLOR = '#0a0f1a';

export type PortalPwaRuntimeConfig = {
  resellerId: string;
  clientSlug: string;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  scope: string;
  swPath: string;
  manifestPath: string;
  subscribeApi: string;
  iconBase: string;
  portalScope: string;
};

export function getPortalPwaConfig(resellerId: string, clientSlug: string): PortalPwaRuntimeConfig {
  const base = `/portal/${resellerId}/cliente/${clientSlug}`;
  return {
    resellerId,
    clientSlug,
    name: 'Mis Leads — Panel de asesoras',
    shortName: 'Mis Leads',
    description: 'Gestión de leads en tiempo real',
    themeColor: PORTAL_PWA_THEME_COLOR,
    backgroundColor: PORTAL_PWA_BACKGROUND_COLOR,
    startUrl: base,
    scope: `${base}/`,
    swPath: `${base}/sw.js`,
    manifestPath: `${base}/manifest.webmanifest`,
    subscribeApi: '/api/portal/push/subscribe',
    iconBase: '/pwa/portal',
    portalScope: `${resellerId}/${clientSlug}`,
  };
}

/** Manifest JSON — misma estructura que public/cwf-panel/manifest.webmanifest */
export function buildPortalManifest(resellerId: string, clientSlug: string) {
  const startUrl = `/portal/${resellerId}/cliente/${clientSlug}`;
  return {
    id: startUrl,
    name: 'Mis Leads — Panel de asesoras',
    short_name: 'Mis Leads',
    description: 'Gestión de leads en tiempo real',
    start_url: startUrl,
    scope: `${startUrl}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: PORTAL_PWA_BACKGROUND_COLOR,
    theme_color: PORTAL_PWA_THEME_COLOR,
    lang: 'es-MX',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: PORTAL_PWA_ICON_192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: PORTAL_PWA_ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: PORTAL_PWA_ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
