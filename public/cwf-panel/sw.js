/**
 * Service worker — notificaciones push para CWF Panel.
 * Scope: /cwf-panel/
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'CWF México', body: 'Nuevo mensaje', url: '/cwf-panel/conversaciones', icon: '/pwa/cwf/icon-192.png' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/pwa/cwf/icon-192.png',
      badge: '/pwa/cwf/icon-192.png',
      tag: payload.tag || 'cwf-panel-message',
      data: { url: payload.url || '/cwf-panel/conversaciones' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/cwf-panel/conversaciones';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/cwf-panel/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
