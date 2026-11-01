export const PORTAL_PWA_ICON_192 = '/pwa/portal/icon-192.png?v=2';
export const PORTAL_PWA_ICON_512 = '/pwa/portal/icon-512.png?v=2';
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

/** Íconos de la app: Luciano usa su logo; el resto de revendedores usa el de Agentia. */
export function portalIconsFor(resellerId: string) {
  const isLuciano = resellerId.trim().toLowerCase() === 'luciano';
  const base = isLuciano ? '/pwa/portal' : '/pwa/agentia-brand';
  const v = isLuciano ? '?v=2' : '?v=3';
  return [
    { src: `${base}/icon-192.png${v}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${base}/icon-512.png${v}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: `${base}/icon-512.png${v}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
}

/** Ícono para notificaciones push según el revendedor. */
export function portalNotificationIcon(resellerId: string): string {
  return portalIconsFor(resellerId)[0].src;
}

/** Nombre corto (≤12) para debajo del ícono, cortando en palabra. */
export function shortAppName(name: string, max = 12): string {
  const n = name.trim();
  if (n.length <= max) return n;
  const cut = n.slice(0, max + 1);
  const i = cut.lastIndexOf(' ');
  return (i >= 4 ? cut.slice(0, i) : n.slice(0, max)).trim();
}

/** Manifest JSON — misma estructura que public/cwf-panel/manifest.webmanifest */
export function buildPortalManifest(resellerId: string, clientSlug: string, appName?: string) {
  const startUrl = `/portal/${resellerId}/cliente/${clientSlug}`;
  const name = (appName || '').trim();
  return {
    id: startUrl,
    name: name || 'Mis Leads — Panel de asesoras',
    short_name: name ? shortAppName(name) : 'Mis Leads',
    description: 'Gestión de leads en tiempo real',
    start_url: startUrl,
    // Sin "/" final: start_url debe quedar dentro del scope o Chrome no ofrece instalar.
    scope: startUrl,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: PORTAL_PWA_BACKGROUND_COLOR,
    theme_color: PORTAL_PWA_THEME_COLOR,
    lang: 'es-MX',
    categories: ['business', 'productivity'],
    icons: portalIconsFor(resellerId),
  };
}

/** Manifest de la app del revendedor (dashboard: agregar clientes, brief, etc.). */
export function buildResellerManifest(resellerId: string, appName?: string) {
  const name = (appName || '').trim() || 'Panel de revendedor';
  return {
    id: `/portal/${resellerId}/dashboard`,
    name,
    short_name: shortAppName(name),
    description: 'Panel del revendedor: clientes, leads y seguimiento',
    start_url: `/portal/${resellerId}/dashboard`,
    scope: `/portal/${resellerId}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: PORTAL_PWA_BACKGROUND_COLOR,
    theme_color: PORTAL_PWA_THEME_COLOR,
    lang: 'es-MX',
    categories: ['business', 'productivity'],
    icons: portalIconsFor(resellerId),
  };
}
