export type PanelPushId = 'cwf' | 'agentia' | 'izzi';

export type PanelPushConfig = {
  panel: PanelPushId;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  scope: string;
  manifestPath: string;
  swPath: string;
  subscribeApi: string;
  iconBase: string;
};

export const CWF_PANEL_PWA: PanelPushConfig = {
  panel: 'cwf',
  name: 'CWF México — Panel',
  shortName: 'CWF Panel',
  description: 'Conversaciones y cotizaciones Flood CWF México',
  themeColor: '#1a1208',
  backgroundColor: '#1a1208',
  startUrl: '/cwf-panel/conversaciones',
  scope: '/cwf-panel/',
  manifestPath: '/cwf-panel/manifest.webmanifest',
  swPath: '/cwf-panel/sw.js',
  subscribeApi: '/api/cwf-panel/push/subscribe',
  iconBase: '/pwa/cwf',
};

export const AGENTIA_PANEL_PWA: PanelPushConfig = {
  panel: 'agentia',
  name: 'Agentia — Panel de conversaciones',
  shortName: 'Agentia Panel',
  description: 'WhatsApp y conversaciones Agentia',
  themeColor: '#0a0f1a',
  backgroundColor: '#0a0f1a',
  startUrl: '/agentia-panel/conversaciones',
  scope: '/agentia-panel/',
  manifestPath: '/agentia-panel/manifest.webmanifest',
  swPath: '/agentia-panel/sw.js',
  subscribeApi: '/api/agentia-panel/push/subscribe',
  iconBase: '/pwa/agentia',
};

export const IZZI_PANEL_PWA: PanelPushConfig = {
  panel: 'izzi',
  name: 'izzi — Panel de conversaciones',
  shortName: 'izzi Panel',
  description: 'Conversaciones WhatsApp izzi: ventas y reclutamiento',
  themeColor: '#140810',
  backgroundColor: '#140810',
  startUrl: '/izzi-panel/conversaciones',
  scope: '/izzi-panel/',
  manifestPath: '/izzi-panel/manifest.webmanifest',
  swPath: '/izzi-panel/sw.js',
  subscribeApi: '/api/izzi-panel/push/subscribe',
  iconBase: '/pwa/izzi',
};

export function clientIdToPanel(clientId: string): PanelPushId | null {
  const c = clientId.trim().toLowerCase();
  if (c === 'cwf') return 'cwf';
  if (c === 'agentia-ventas') return 'agentia';
  if (c === 'izzi') return 'izzi';
  return null;
}
