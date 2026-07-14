'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelNotificationSettings } from '@/components/panel/PanelNotificationSettings';
import {
  clearPanelAppBadge,
  loadPanelNotificationPrefs,
  syncNotificationPrefsToServiceWorker,
} from '@/lib/panel-notification-prefs';
import { getPortalPwaConfig } from '@/lib/portal-pwa-config';
import {
  PORTAL_AUTH_EVENT,
  subscribePortalPush,
  type PortalPushSubscribeResult,
} from '@/lib/portal-pwa-subscribe';

type PortalClientShellProps = {
  resellerId: string;
  clientSlug: string;
  vapidPublicKey?: string | null;
};

/**
 * Shell PWA del portal — SW + push en segundo plano.
 * Sin banner/modal de instalación: el portal carga libre.
 * La campana permite activar notificaciones de forma voluntaria.
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
    async (opts?: { requestPermission?: boolean }) => {
      if (subscribedRef.current) return;

      const result = await subscribePortalPush({
        swPath: config.swPath,
        scope: config.scope,
        subscribeApi: config.subscribeApi,
        resellerId,
        clientSlug,
        vapidPublicKey,
        // Al cargar: solo si el permiso ya está granted. Pedir permiso solo desde la campana.
        requestPermission: opts?.requestPermission === true,
      });

      setPushStatus(result);
      if (result.ok) subscribedRef.current = true;
    },
    [config, resellerId, clientSlug, vapidPublicKey],
  );

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
        if (!subscribedRef.current) void attemptSubscribe({ requestPermission: false });
      }
    };

    const onAuthed = () => {
      void attemptSubscribe({ requestPermission: false });
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener(PORTAL_AUTH_EVENT, onAuthed);

    void attemptSubscribe({ requestPermission: false });
    const retry = window.setInterval(() => {
      if (!subscribedRef.current) void attemptSubscribe({ requestPermission: false });
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener(PORTAL_AUTH_EVENT, onAuthed);
      window.clearInterval(retry);
    };
  }, [config.portalScope, attemptSubscribe]);

  return (
    <PanelNotificationSettings
      panel="portal"
      portalScope={config.portalScope}
      resellerId={resellerId}
      clientSlug={clientSlug}
      pushStatus={pushStatus}
      onRetryPush={() => {
        subscribedRef.current = false;
        void attemptSubscribe({ requestPermission: true });
      }}
    />
  );
}
