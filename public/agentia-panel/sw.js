/**
 * Service worker — notificaciones push para Agentia Panel.
 * Scope: /agentia-panel/
 */
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
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/pwa/agentia/icon-192.png',
      badge: '/pwa/agentia/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      sound: '/notification.mp3',
      requireInteraction: true,
      tag: payload.tag || 'nuevo-mensaje',
      data: { url: payload.url || '/agentia-panel/conversaciones' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/agentia-panel/conversaciones';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/agentia-panel/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
