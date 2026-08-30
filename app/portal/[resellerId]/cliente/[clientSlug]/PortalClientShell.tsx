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

/** Limpieza one-shot SOLO del SW legado global roto (/portal-sw.js). No toca el SW bueno. */
const LEGACY_SW_CLEARED_FLAG = 'agentia_portal_legacy_sw_cleared_v1';

async function unregisterLegacyPortalServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const script =
        reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      // Solo el legado global "/portal-sw.js" (raíz). NUNCA el SW por cliente (que da el push).
      if (script.includes('/portal-sw.js')) {
        await reg.unregister();
      }
    }
  } catch {
    // ignore
  }
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
      // Limpia SOLO el SW legado global roto (una vez). No toca el SW por cliente.
      try {
        if (localStorage.getItem(LEGACY_SW_CLEARED_FLAG) !== '1') {
          await unregisterLegacyPortalServiceWorker();
          localStorage.setItem(LEGACY_SW_CLEARED_FLAG, '1');
        }
      } catch {
        // ignore
      }

      if (cancelled) return;

      // Re-suscribir en silencio si el usuario YA permitió notificaciones.
      // No pide permiso ni muestra prompts; mantiene viva la suscripción.
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        await attemptSubscribe(false);
      }
    })();

    const onFocus = () => {
      if (
        !subscribedRef.current &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        void attemptSubscribe(false);
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
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
        return attemptSubscribe(true);
      }}
    />
  );
}
