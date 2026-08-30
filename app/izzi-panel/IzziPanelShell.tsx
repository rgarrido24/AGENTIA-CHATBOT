'use client';

import { PanelNotificationSettings } from '@/components/panel/PanelNotificationSettings';
import { useEffect } from 'react';
import {
  clearPanelAppBadge,
  loadPanelNotificationPrefs,
  syncNotificationPrefsToServiceWorker,
} from '@/lib/panel-notification-prefs';

export function IzziPanelShell() {
  useEffect(() => {
    const sync = () => {
      void syncNotificationPrefsToServiceWorker(loadPanelNotificationPrefs('izzi'));
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
  }, []);

  return <PanelNotificationSettings panel="izzi" />;
}
