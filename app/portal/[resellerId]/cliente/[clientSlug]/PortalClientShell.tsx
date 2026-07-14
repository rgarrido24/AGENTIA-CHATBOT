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

/** Limpieza one-shot de SW rotos (pantalla negra iOS). No debe repetirse siempre. */
const SW_CLEARED_FLAG = 'agentia_portal_sw_cleared_v3';

async function unregisterBrokenPortalServiceWorkers(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

  let removed = false;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const scope = reg.scope || '';
      const script = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      const isPortalScope = scope.includes('/portal/') && scope.includes('/cliente/');
      const isLegacyPortalSw = script.includes('portal-sw');
      if (!isPortalScope && !isLegacyPortalSw) continue;

      const ok = await reg.unregister();
      if (ok) removed = true;
    }
  } catch {
    // ignore
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => /portal|mis.?leads/i.test(k))
          .map((k) => caches.delete(k)),
      );
    }
  } catch {
    // ignore
  }

  return removed;
}

/**
 * Shell del portal:
 * - Limpieza one-shot de SW rotos (iPhone)
 * - Sin banners / sin pedir permiso solo
 * - Campana: activa push a voluntad
 * - Si el permiso ya está "granted", re-suscribe en silencio (no mata el SW)
 */
export function PortalClientShell({
  resellerId,
  clientSlug,
  vapidPublicKey,
}: PortalClientShellProps) {
  const subscribedRef = useRef(false);
  const [pushStatus, setPushStatus] = useState<PortalPushSubscribeResult | null>(null);
  const config = getPortalPwaConfig(resellerId, clientSlug);

  const attemptSubscribe = useCallback(
    async (requestPermission: boolean) => {
      if (subscribedRef.current && !requestPermission) return;

      const result = await subscribePortalPush({
        swPath: config.swPath,
        scope: config.scope,
        subscribeApi: config.subscribeApi,
        resellerId,
        clientSlug,
        vapidPublicKey,
        requestPermission,
        forceNew: requestPermission,
      });

      setPushStatus(result);
      if (result.ok) {
        subscribedRef.current = true;
        // Tras activar en Android, dispara prueba automática para confirmar que llega.
        if (requestPermission) {
          try {
            await fetch('/api/portal/push/test', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resellerId, clientSlug }),
            });
          } catch {
            // ignore — la campana tiene botón de prueba manual
          }
        }
      }
    },
    [config, resellerId, clientSlug, vapidPublicKey],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let alreadyCleared = false;
      try {
        alreadyCleared = localStorage.getItem(SW_CLEARED_FLAG) === '1';
      } catch {
        alreadyCleared = false;
      }

      // Solo una vez por dispositivo: limpia SW que dejaban iOS en negro.
      if (!alreadyCleared) {
        const removed = await unregisterBrokenPortalServiceWorkers();
        try {
          localStorage.setItem(SW_CLEARED_FLAG, '1');
        } catch {
          // ignore
        }
        if (removed && !cancelled) {
          window.location.reload();
          return;
        }
      }

      if (cancelled) return;

      // Re-suscribir en silencio solo si el usuario YA permitió notificaciones.
      // No pide permiso ni muestra prompts.
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        await attemptSubscribe(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptSubscribe]);

  return (
    <PanelNotificationSettings
      panel="portal"
      portalScope={config.portalScope}
      resellerId={resellerId}
      clientSlug={clientSlug}
      pushStatus={pushStatus}
      onRetryPush={() => {
        subscribedRef.current = false;
        void attemptSubscribe(true);
      }}
    />
  );
}
