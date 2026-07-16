'use client';

import { useEffect, useRef } from 'react';
import type { PanelPushConfig } from '@/lib/panel-pwa-config';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), ms);
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

type PanelPwaProviderProps = {
  config: PanelPushConfig;
  vapidPublicKey?: string | null;
};

export function PanelPwaProvider({ config, vapidPublicKey }: PanelPwaProviderProps) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const run = async () => {
      try {
        const reg = await navigator.serviceWorker.register(config.swPath, { scope: config.scope });
        try {
          await withTimeout(navigator.serviceWorker.ready, 8000);
        } catch {
          // ready puede colgarse en algunos navegadores; seguimos con la registration
        }
        if (cancelled) return;

        const vapidKey = vapidPublicKey?.trim();
        if (!vapidKey || !('PushManager' in window)) return;

        // Guardar config en el SW para re-suscribir en segundo plano (pushsubscriptionchange)
        const postConfig = () => {
          const target = reg.active || navigator.serviceWorker.controller;
          target?.postMessage({
            type: 'SET_PUSH_CONFIG',
            config: {
              vapidPublicKey: vapidKey,
              subscribeApi: config.subscribeApi,
              body: {},
            },
          });
        };
        postConfig();

        let permission: NotificationPermission = Notification.permission;
        if (permission === 'denied') return;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted' || cancelled) return;

        const pushReg = reg.active ? reg : await navigator.serviceWorker.ready;
        // Re-suscribir SIEMPRE en cada apertura: refresca endpoints rotados en el servidor.
        const existing = await pushReg.pushManager.getSubscription();
        const applicationServerKey = urlBase64ToUint8Array(vapidKey) as BufferSource;
        const sub =
          existing ||
          (await pushReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }));

        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

        const res = await fetch(config.subscribeApi, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            expirationTime: json.expirationTime ?? null,
          }),
        });
        if (res.ok) subscribedRef.current = true;
        postConfig();
      } catch (err) {
        console.warn(`[PWA:${config.panel}]`, err);
      }
    };

    void run();

    // Re-suscribir al volver a foco (self-heal si el endpoint cambió mientras estaba cerrada)
    const onFocus = () => {
      if (!subscribedRef.current) void run();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [config, vapidPublicKey]);

  return null;
}
