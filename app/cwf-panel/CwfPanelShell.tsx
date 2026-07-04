'use client';

import { PanelNotificationSettings } from '@/components/panel/PanelNotificationSettings';
import { useEffect } from 'react';
import { clearPanelAppBadge, loadPanelNotificationPrefs, syncNotificationPrefsToServiceWorker } from '@/lib/panel-notification-prefs';

export function CwfPanelShell() {
  useEffect(() => {
    const sync = () => {
      void syncNotificationPrefsToServiceWorker(loadPanelNotificationPrefs('cwf'));
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

  return <PanelNotificationSettings panel="cwf" />;
}
