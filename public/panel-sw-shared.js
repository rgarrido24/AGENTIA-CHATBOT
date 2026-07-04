/**
 * Lógica compartida de notificaciones push para service workers de paneles.
 * importScripts('/panel-sw-shared.js') desde cwf-panel/sw.js y agentia-panel/sw.js
 */
/* eslint-disable no-restricted-globals */

var cachedPrefs = {
  sound: true,
  vibration: true,
  badge: true,
  soundUrl: '/notification.mp3',
};

var badgeCount = 0;

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'SET_NOTIFICATION_PREFS' && data.prefs) {
    cachedPrefs = {
      sound: data.prefs.sound !== false,
      vibration: data.prefs.vibration !== false,
      badge: data.prefs.badge !== false,
      soundUrl: data.prefs.soundUrl || '/notification.mp3',
    };
  }
  if (data.type === 'CLEAR_BADGE') {
    badgeCount = 0;
    updateAppBadge();
  }
});

function updateAppBadge() {
  var p = Promise.resolve();
  if (!cachedPrefs.badge || badgeCount <= 0) {
    if (typeof navigator.clearAppBadge === 'function') {
      p = navigator.clearAppBadge();
    }
    return p;
  }
  if (typeof navigator.setAppBadge === 'function') {
    return navigator.setAppBadge(badgeCount);
  }
  return p;
}

function handlePanelPush(registration, payload, defaults) {
  badgeCount += 1;

  var title = payload.title || defaults.title;
  var options = {
    body: payload.body || defaults.body,
    icon: payload.icon || defaults.icon,
    badge: defaults.badgeIcon,
    requireInteraction: true,
    tag: payload.tag || 'nuevo-mensaje',
    renotify: true,
    data: { url: payload.url || defaults.url },
  };

  if (cachedPrefs.vibration) {
    options.vibrate = [200, 100, 200];
  }
  if (cachedPrefs.sound) {
    options.sound = cachedPrefs.soundUrl || '/notification.mp3';
  }

  return registration
    .showNotification(title, options)
    .then(function () {
      return updateAppBadge();
    });
}

function handleNotificationClick(targetPath, panelSegment) {
  badgeCount = 0;
  return updateAppBadge().then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url.indexOf(panelSegment) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    });
  });
}
