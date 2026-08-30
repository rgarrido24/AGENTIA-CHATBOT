import { NextResponse } from 'next/server';
import { PORTAL_PWA_ICON_192, getPortalPwaConfig } from '@/lib/portal-pwa-config';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  const config = getPortalPwaConfig(resellerId, clientSlug);
  const icon = PORTAL_PWA_ICON_192;

  const js = `/**
 * Service worker — portal asesoras (push de leads).
 * Scope: ${config.scope}
 */
importScripts('/panel-sw-shared.js');

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 Nuevo lead!',
    body: 'Nuevo lead',
    url: '${config.startUrl}',
    icon: '${icon}',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    handlePanelPush(self.registration, payload, {
      title: '🔔 Nuevo lead!',
      body: 'Nuevo lead',
      url: '${config.startUrl}',
      icon: '${icon}',
      badgeIcon: '${icon}',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '${config.startUrl}';
  event.waitUntil(handleNotificationClick(target, '${config.scope}'));
});
`;

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, max-age=0, must-revalidate',
    },
  });
}
