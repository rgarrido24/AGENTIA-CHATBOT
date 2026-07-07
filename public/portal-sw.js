/**
 * Service worker — notificaciones push para portal de asesoras (Luciano).
 * Scope: /portal/{resellerId}/cliente/{clientSlug}/
 */
/* eslint-disable no-restricted-globals */

var PORTAL_LOGO =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1782579834/WhatsApp_Image_2026-06-27_at_11.03.20_AM_tzq2rn.jpg';

var badgeCount = 0;

function updateAppBadge() {
  if (typeof navigator.setAppBadge === 'function' && badgeCount > 0) {
    return navigator.setAppBadge(badgeCount);
  }
  if (typeof navigator.clearAppBadge === 'function' && badgeCount <= 0) {
    return navigator.clearAppBadge();
  }
  return Promise.resolve();
}

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var payload = {
    title: '🔔 Nuevo lead!',
    body: '',
    url: '/',
    icon: PORTAL_LOGO,
    badge: PORTAL_LOGO,
    badgeCount: null,
  };

  try {
    if (event.data) {
      payload = Object.assign(payload, event.data.json());
    }
  } catch (e) {
    /* ignore */
  }

  if (typeof payload.badgeCount === 'number' && payload.badgeCount > 0) {
    badgeCount = payload.badgeCount;
  } else {
    badgeCount += 1;
  }

  event.waitUntil(
    self.registration
      .showNotification(payload.title || '🔔 Nuevo lead!', {
        body: payload.body || '',
        icon: payload.icon || PORTAL_LOGO,
        badge: payload.badge || PORTAL_LOGO,
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        tag: payload.tag || 'nuevo-lead',
        renotify: true,
        data: { url: payload.url || '/' },
      })
      .then(function () {
        return updateAppBadge();
      }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/';
  badgeCount = 0;

  event.waitUntil(
    updateAppBadge().then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          if (client.url.indexOf('/portal/') !== -1 && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
      });
    }),
  );
});
