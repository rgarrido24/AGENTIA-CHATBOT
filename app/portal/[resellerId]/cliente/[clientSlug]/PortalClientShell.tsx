'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelNotificationSettings } from '@/components/panel/PanelNotificationSettings';
import { getPortalPwaConfig } from '@/lib/portal-pwa-config';
import {
  subscribePortalPush,
  type PortalPushSubscribeResult,
} from '@/lib/portal-pwa-subscribe';

type PortalClientShellProps = {
  resellerId: string;
  clientSlug: string;
  vapidPublicKey?: string | null;
};

const SW_CLEARED_FLAG = 'agentia_portal_sw_cleared_v2';

/**
 * Limpia service workers del portal que dejan iPhone con pantalla negra.
 * No re-registra nada automáticamente.
 */
async function unregisterPortalServiceWorkers(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

  let removed = false;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const scope = reg.scope || '';
      if (scope.includes('/portal/') && scope.includes('/cliente/')) {
        const ok = await reg.unregister();
        if (ok) removed = true;
      }
      // SW legado global del portal
      if (scope.endsWith('/') && reg.active?.scriptURL?.includes('portal-sw')) {
        const ok = await reg.unregister();
        if (ok) removed = true;
      }
    }
  } catch {
    // ignore
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => /portal|mis.?leads|pwa/i.test(k))
          .map((k) => caches.delete(k)),
      );
    }
  } catch {
    // ignore
  }

  return removed;
}

/**
 * Shell seguro del portal:
 * - Desactiva SW rotos (fix iPhone pantalla negra)
 * - Sin banners / prompts / registro automático
 * - Campana 🔔 opcional: el usuario activa push a voluntad
 */
export function PortalClientShell({
  resellerId,
  clientSlug,
  vapidPublicKey,
}: PortalClientShellProps) {
  const subscribedRef = useRef(false);
  const [pushStatus, setPushStatus] = useState<PortalPushSubscribeResult | null>(null);
  const [ready, setReady] = useState(false);
  const config = getPortalPwaConfig(resellerId, clientSlug);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const already = sessionStorage.getItem(SW_CLEARED_FLAG) === '1';
        const removed = await unregisterPortalServiceWorkers();
        if (!already && removed && !cancelled) {
          sessionStorage.setItem(SW_CLEARED_FLAG, '1');
          window.location.reload();
          return;
        }
        if (!already) {
          try {
            sessionStorage.setItem(SW_CLEARED_FLAG, '1');
          } catch {
            // ignore
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activatePush = useCallback(async () => {
    subscribedRef.current = false;
    const result = await subscribePortalPush({
      swPath: config.swPath,
      scope: config.scope,
      subscribeApi: config.subscribeApi,
      resellerId,
      clientSlug,
      vapidPublicKey,
      requestPermission: true,
    });
    setPushStatus(result);
    if (result.ok) subscribedRef.current = true;
  }, [config, resellerId, clientSlug, vapidPublicKey]);

  // Campana siempre visible (login y panel). No bloquea la UI.
  return (
    <PanelNotificationSettings
      panel="portal"
      portalScope={config.portalScope}
      resellerId={resellerId}
      clientSlug={clientSlug}
      pushStatus={ready ? pushStatus : null}
      onRetryPush={() => {
        void activatePush();
      }}
    />
  );
}
