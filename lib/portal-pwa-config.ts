export const PORTAL_PWA_ICON_192 = '/pwa/portal/icon-192.png';
export const PORTAL_PWA_ICON_512 = '/pwa/portal/icon-512.png';

export type PortalPwaRuntimeConfig = {
  resellerId: string;
  clientSlug: string;
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
    startUrl: base,
    scope: `${base}/`,
    swPath: `${base}/sw.js`,
    manifestPath: `${base}/manifest.webmanifest`,
    subscribeApi: '/api/portal/push/subscribe',
    iconBase: '/pwa/portal',
    portalScope: `${resellerId}/${clientSlug}`,
  };
}
