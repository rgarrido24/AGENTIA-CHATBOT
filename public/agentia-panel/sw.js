/**
 * Service worker — notificaciones push para Agentia Panel.
 * Scope: /agentia-panel/
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
    title: 'Agentia Panel',
    body: 'Nuevo mensaje',
    url: '/agentia-panel/conversaciones',
    icon: '/pwa/agentia/icon-192.png',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    handlePanelPush(self.registration, payload, {
      title: 'Agentia Panel',
      body: 'Nuevo mensaje',
      url: '/agentia-panel/conversaciones',
      icon: '/pwa/agentia/icon-192.png',
      badgeIcon: '/pwa/agentia/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/agentia-panel/conversaciones';
  event.waitUntil(handleNotificationClick(target, '/agentia-panel/'));
});
