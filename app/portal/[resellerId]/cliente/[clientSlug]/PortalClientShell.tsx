'use client';

import { useEffect, useRef } from 'react';
import { PanelNotificationSettings } from '@/components/panel/PanelNotificationSettings';
import {
  clearPanelAppBadge,
  loadPanelNotificationPrefs,
  syncNotificationPrefsToServiceWorker,
} from '@/lib/panel-notification-prefs';
import { getPortalPwaConfig } from '@/lib/portal-pwa-config';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type PortalClientShellProps = {
  resellerId: string;
  clientSlug: string;
  vapidPublicKey?: string | null;
};

/**
 * Shell PWA del portal — equivalente a CwfPanelShell + PanelPwaProvider en rutas autenticadas.
 * Montado en layout.tsx para que el SW se registre en login y panel (requisito Android).
 */
export function PortalClientShell({
  resellerId,
  clientSlug,
  vapidPublicKey,
}: PortalClientShellProps) {
  const subscribedRef = useRef(false);
  const config = getPortalPwaConfig(resellerId, clientSlug);

  useEffect(() => {
    const sync = () => {
      void syncNotificationPrefsToServiceWorker(
        loadPanelNotificationPrefs('portal', config.portalScope),
      );
    };
    sync();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void clearPanelAppBadge();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [config.portalScope]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        await navigator.serviceWorker.register(config.swPath, { scope: config.scope });
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

        const res = await fetch(config.subscribeApi, {
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
  }, [config, resellerId, clientSlug, vapidPublicKey]);

  return <PanelNotificationSettings panel="portal" portalScope={config.portalScope} />;
}
