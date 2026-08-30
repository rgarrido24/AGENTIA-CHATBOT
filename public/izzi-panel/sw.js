/**
 * Service worker — notificaciones push para izzi Panel.
 * Scope: /izzi-panel/
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
    title: 'izzi Panel',
    body: 'Nuevo mensaje',
    url: '/izzi-panel/conversaciones',
    icon: '/pwa/izzi/icon-192.png',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    handlePanelPush(self.registration, payload, {
      title: 'izzi Panel',
      body: 'Nuevo mensaje',
      url: '/izzi-panel/conversaciones',
      icon: '/pwa/izzi/icon-192.png',
      badgeIcon: '/pwa/izzi/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/izzi-panel/conversaciones';
  event.waitUntil(handleNotificationClick(target, '/izzi-panel/'));
});
