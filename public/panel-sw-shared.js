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

// ── Config de re-suscripción push (persistida en Cache para sobrevivir reinicios del SW) ──
var PUSH_CONFIG_CACHE = 'panel-push-config';
var PUSH_CONFIG_KEY = '/__panel_push_config__';

function savePushConfig(config) {
  if (!config || !config.vapidPublicKey || !config.subscribeApi) return Promise.resolve();
  return caches.open(PUSH_CONFIG_CACHE).then(function (cache) {
    return cache.put(PUSH_CONFIG_KEY, new Response(JSON.stringify(config)));
  }).catch(function () {});
}

function loadPushConfig() {
  return caches.open(PUSH_CONFIG_CACHE).then(function (cache) {
    return cache.match(PUSH_CONFIG_KEY).then(function (res) {
      if (!res) return null;
      return res.json().catch(function () { return null; });
    });
  }).catch(function () { return null; });
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var raw = self.atob(base64);
  var output = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

// Re-suscribe en segundo plano y reenvía la suscripción al servidor.
function resubscribePush() {
  return loadPushConfig().then(function (config) {
    if (!config || !config.vapidPublicKey || !config.subscribeApi) return;
    return self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
      })
      .then(function (sub) {
        var json = sub.toJSON();
        if (!json.endpoint || !json.keys || !json.keys.p256dh || !json.keys.auth) return;
        var body = {};
        var extra = config.body || {};
        for (var k in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, k)) body[k] = extra[k];
        }
        body.endpoint = json.endpoint;
        body.keys = { p256dh: json.keys.p256dh, auth: json.keys.auth };
        body.expirationTime = json.expirationTime || null;
        return fetch(config.subscribeApi, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      })
      .catch(function () {});
  });
}

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
  if (data.type === 'SET_PUSH_CONFIG' && data.config) {
    event.waitUntil(savePushConfig(data.config));
  }
  if (data.type === 'CLEAR_BADGE') {
    badgeCount = 0;
    updateAppBadge();
  }
});

// Cuando el navegador rota/expira la suscripción, re-suscribir SIN necesidad de abrir la app.
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(resubscribePush());
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
    options.vibrate = [300, 100, 300, 100, 300];
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
