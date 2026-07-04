/**
 * Service worker — notificaciones push para CWF Panel.
 * Scope: /cwf-panel/
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
    title: 'CWF México',
    body: 'Nuevo mensaje',
    url: '/cwf-panel/conversaciones',
    icon: '/pwa/cwf/icon-192.png',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    handlePanelPush(self.registration, payload, {
      title: 'CWF México',
      body: 'Nuevo mensaje',
      url: '/cwf-panel/conversaciones',
      icon: '/pwa/cwf/icon-192.png',
      badgeIcon: '/pwa/cwf/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/cwf-panel/conversaciones';
  event.waitUntil(handleNotificationClick(target, '/cwf-panel/'));
});
