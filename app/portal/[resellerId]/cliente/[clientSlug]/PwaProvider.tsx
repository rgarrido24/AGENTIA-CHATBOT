'use client';

import { useEffect, useRef } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type PwaProviderProps = {
  resellerId: string;
  clientSlug: string;
  vapidPublicKey?: string | null;
};

export function PwaProvider({ resellerId, clientSlug, vapidPublicKey }: PwaProviderProps) {
  const subscribedRef = useRef(false);
  const scope = `/portal/${resellerId}/cliente/${clientSlug}/`;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        await navigator.serviceWorker.register('/portal-sw.js', { scope });
        const reg = await navigator.serviceWorker.ready;
        if (cancelled) return;

        const vapidKey = vapidPublicKey?.trim();
        if (!vapidKey || !('PushManager' in window) || subscribedRef.current) return;

        let permission: NotificationPermission = Notification.permission;
        if (permission === 'denied') return;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted' || cancelled) return;

        const existing = await reg.pushManager.getSubscription();
        const applicationServerKey = urlBase64ToUint8Array(vapidKey) as BufferSource;
        const sub =
          existing ||
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }));

        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

        const res = await fetch('/api/portal/push/subscribe', {
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
        if (res.ok) subscribedRef.current = true;
      } catch (err) {
        console.warn('[PWA:portal]', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resellerId, clientSlug, scope, vapidPublicKey]);

  return null;
}
