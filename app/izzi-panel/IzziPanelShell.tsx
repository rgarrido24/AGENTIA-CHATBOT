'use client';

import { PanelNotificationSettings } from '@/components/panel/PanelNotificationSettings';
import { useEffect, useState } from 'react';
import {
  clearPanelAppBadge,
  loadPanelNotificationPrefs,
  syncNotificationPrefsToServiceWorker,
} from '@/lib/panel-notification-prefs';

export function IzziPanelShell() {
  const [accent, setAccent] = useState('#EC008C');

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

    void fetch('/api/izzi-panel/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.brand === 'rgo') setAccent('#3D6BC4');
      })
      .catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return <PanelNotificationSettings panel="izzi" accent={accent} />;
}
