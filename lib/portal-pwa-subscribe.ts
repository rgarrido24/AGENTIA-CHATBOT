/** Lógica compartida de suscripción push del portal (cliente). */

export type PortalPushSubscribeResult =
  | { ok: true; count?: number }
  | {
      ok: false;
      reason:
        | 'no_sw'
        | 'no_vapid'
        | 'no_push'
        | 'denied'
        | 'invalid_sub'
        | 'unauthorized'
        | 'pwa_disabled'
        | 'network'
        | 'unknown'
        | 'timeout';
      detail?: string;
    };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      reject(new Error(`timeout:${label}`));
    }, ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (err) => {
        window.clearTimeout(t);
        reject(err);
      },
    );
  });
}

async function getActiveRegistration(
  swPath: string,
  scope: string,
): Promise<ServiceWorkerRegistration> {
  const reg = await withTimeout(
    navigator.serviceWorker.register(swPath, { scope }),
    8000,
    'register',
  );

  // Preferir reg.active / ready con timeout — NUNCA esperar ready sin límite (congela iOS/Android).
  if (reg.active) return reg;

  try {
    await withTimeout(navigator.serviceWorker.ready, 8000, 'ready');
  } catch {
    // Si ready cuelga, intentamos con la registration actual igual
  }

  if (reg.installing) {
    await withTimeout(
      new Promise<void>((resolve) => {
        const nw = reg.installing;
        if (!nw || nw.state === 'activated') {
          resolve();
          return;
        }
        nw.addEventListener('statechange', () => {
          if (nw.state === 'activated' || nw.state === 'redundant') resolve();
        });
      }),
      8000,
      'activate',
    );
  }

  return reg;
}

export async function subscribePortalPush(params: {
  swPath: string;
  scope: string;
  subscribeApi: string;
  resellerId: string;
  clientSlug: string;
  vapidPublicKey?: string | null;
  requestPermission?: boolean;
  forceNew?: boolean;
}): Promise<PortalPushSubscribeResult> {
  const {
    swPath,
    scope,
    subscribeApi,
    resellerId,
    clientSlug,
    vapidPublicKey,
    requestPermission = false,
    forceNew = false,
  } = params;

  if (!('serviceWorker' in navigator)) {
    return { ok: false, reason: 'no_sw', detail: 'Este navegador no soporta service workers' };
  }

  const vapidKey = vapidPublicKey?.trim();
  if (!vapidKey) {
    return {
      ok: false,
      reason: 'no_vapid',
      detail: 'Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en el servidor',
    };
  }
  if (!('PushManager' in window)) {
    return {
      ok: false,
      reason: 'no_push',
      detail: 'Usa Android Chrome (en iPhone Safari el push web casi no funciona)',
    };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'denied') {
    return {
      ok: false,
      reason: 'denied',
      detail: 'Permiso bloqueado — en Chrome: candado del sitio → Notificaciones → Permitir',
    };
  }
  if (permission === 'default') {
    if (!requestPermission) {
      return { ok: false, reason: 'denied', detail: 'permission_not_requested' };
    }
    try {
      permission = await withTimeout(
        Notification.requestPermission(),
        20000,
        'permission',
      );
    } catch {
      return {
        ok: false,
        reason: 'timeout',
        detail: 'El diálogo de permiso no respondió. Revisá notificaciones del sitio en Chrome.',
      };
    }
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied', detail: 'No se concedió permiso de notificaciones' };
  }

  try {
    const reg = await getActiveRegistration(swPath, scope);

    // Persistir config en el SW para re-suscribir en segundo plano (pushsubscriptionchange).
    const swTarget = reg.active || navigator.serviceWorker.controller;
    swTarget?.postMessage({
      type: 'SET_PUSH_CONFIG',
      config: {
        vapidPublicKey: vapidKey,
        subscribeApi,
        body: { resellerId, clientSlug },
      },
    });

    const pushManager = reg.pushManager;

    let existing = await pushManager.getSubscription();
    if (existing && forceNew) {
      try {
        await existing.unsubscribe();
      } catch {
        // ignore
      }
      existing = null;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidKey) as BufferSource;
    const sub =
      existing ||
      (await withTimeout(
        pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }),
        15000,
        'subscribe',
      ));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'invalid_sub', detail: 'El navegador no devolvió keys push' };
    }

    const res = await withTimeout(
      fetch(subscribeApi, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resellerId,
          clientSlug,
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          expirationTime: json.expirationTime ?? null,
        }),
      }),
      15000,
      'api',
    );

    const data = (await res.json().catch(() => ({}))) as { error?: string; count?: number };

    if (res.status === 401) {
      return {
        ok: false,
        reason: 'unauthorized',
        detail: 'Inicia sesión en el panel antes de activar notificaciones',
      };
    }
    if (res.status === 403) {
      return { ok: false, reason: 'pwa_disabled', detail: data.error || 'PWA deshabilitada' };
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: 'network',
        detail: String(data.error ?? `HTTP ${res.status}`),
      };
    }

    const count = typeof data.count === 'number' ? data.count : undefined;
    if (count === 0) {
      return {
        ok: false,
        reason: 'network',
        detail: 'El servidor respondió OK pero no guardó la suscripción',
      };
    }

    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('timeout:')) {
      return {
        ok: false,
        reason: 'timeout',
        detail: `Se agotó el tiempo (${msg.replace('timeout:', '')}). Probá de nuevo en Chrome Android.`,
      };
    }
    return {
      ok: false,
      reason: 'unknown',
      detail: msg,
    };
  }
}

export const PORTAL_AUTH_EVENT = 'agentia-portal-authed';

export function notifyPortalAuthed(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PORTAL_AUTH_EVENT));
}
