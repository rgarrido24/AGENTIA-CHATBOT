/** Lógica compartida de suscripción push del portal (cliente). */

export type PortalPushSubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'no_sw' | 'no_vapid' | 'no_push' | 'denied' | 'invalid_sub' | 'unauthorized' | 'pwa_disabled' | 'network' | 'unknown'; detail?: string };

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
}): Promise<PortalPushSubscribeResult> {
  const { swPath, scope, subscribeApi, resellerId, clientSlug, vapidPublicKey } = params;

  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'no_sw' };

  const vapidKey = vapidPublicKey?.trim();
  if (!vapidKey) return { ok: false, reason: 'no_vapid' };
  if (!('PushManager' in window)) return { ok: false, reason: 'no_push' };

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'denied') return { ok: false, reason: 'denied' };
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    await navigator.serviceWorker.register(swPath, { scope });
    const reg = await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const applicationServerKey = urlBase64ToUint8Array(vapidKey) as BufferSource;
    const sub =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'invalid_sub' };
    }

    const res = await fetch(subscribeApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resellerId,
        clientSlug,
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        expirationTime: json.expirationTime ?? null,
      }),
    });

    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    if (res.status === 403) return { ok: false, reason: 'pwa_disabled' };
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, reason: 'network', detail: String(data?.error ?? res.status) };
    }

    return { ok: true };
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
