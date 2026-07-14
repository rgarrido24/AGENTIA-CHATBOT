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
        | 'unknown';
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

export async function subscribePortalPush(params: {
  swPath: string;
  scope: string;
  subscribeApi: string;
  resellerId: string;
  clientSlug: string;
  vapidPublicKey?: string | null;
  /** Si false (default), no muestra el prompt del navegador; solo suscribe si ya está granted. */
  requestPermission?: boolean;
  /** Si true, cancela suscripción previa y crea una nueva (recomendado al pulsar Activar). */
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
      detail: 'Permiso bloqueado en el navegador — actívalo en Ajustes del sitio',
    };
  }
  if (permission === 'default') {
    if (!requestPermission) {
      return { ok: false, reason: 'denied', detail: 'permission_not_requested' };
    }
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied', detail: 'No se concedió permiso de notificaciones' };
  }

  try {
    const reg = await navigator.serviceWorker.register(swPath, { scope });
    await navigator.serviceWorker.ready;

    // Esperar a que el SW esté activo (Safari/Android a veces tarda)
    let active = reg.active;
    if (!active) {
      await new Promise<void>((resolve) => {
        const t = window.setTimeout(() => resolve(), 3000);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw?.addEventListener('statechange', () => {
            if (nw.state === 'activated') {
              window.clearTimeout(t);
              resolve();
            }
          });
        });
      });
      active = reg.active;
    }

    const pushReg = await navigator.serviceWorker.ready;
    let existing = await pushReg.pushManager.getSubscription();
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
      (await pushReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'invalid_sub', detail: 'El navegador no devolvió keys push' };
    }

    const res = await fetch(subscribeApi, {
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
    });

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
    return {
      ok: false,
      reason: 'unknown',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export const PORTAL_AUTH_EVENT = 'agentia-portal-authed';

export function notifyPortalAuthed(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PORTAL_AUTH_EVENT));
}
