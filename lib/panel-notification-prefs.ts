/** Preferencias de notificación PWA — compartidas cliente / service worker. */

export type NotificationToneId = 'classic' | 'soft' | 'alert';

export type PanelNotificationPrefs = {
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  tone: NotificationToneId;
};

export type PanelKind = 'cwf' | 'agentia' | 'portal';

export const NOTIFICATION_TONES: { id: NotificationToneId; label: string; url: string }[] = [
  { id: 'classic', label: 'Clásico', url: '/notification.mp3' },
  { id: 'soft', label: 'Suave', url: '/notification-soft.mp3' },
  { id: 'alert', label: 'Alerta', url: '/notification-alert.mp3' },
];

export const DEFAULT_PANEL_NOTIFICATION_PREFS: PanelNotificationPrefs = {
  sound: true,
  vibration: true,
  badge: true,
  tone: 'classic',
};

export function storageKeyForPanel(panel: PanelKind, portalScope?: string): string {
  if (panel === 'portal') return `portal-notification-prefs-${portalScope ?? 'default'}`;
  return `${panel}-panel-notification-prefs`;
}

export function loadPanelNotificationPrefs(
  panel: PanelKind,
  portalScope?: string,
): PanelNotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PANEL_NOTIFICATION_PREFS;
  try {
    const raw = window.localStorage.getItem(storageKeyForPanel(panel, portalScope));
    if (!raw) return DEFAULT_PANEL_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw) as Partial<PanelNotificationPrefs>;
    const tone = NOTIFICATION_TONES.some((t) => t.id === parsed.tone)
      ? (parsed.tone as NotificationToneId)
      : 'classic';
    return {
      sound: parsed.sound !== false,
      vibration: parsed.vibration !== false,
      badge: parsed.badge !== false,
      tone,
    };
  } catch {
    return DEFAULT_PANEL_NOTIFICATION_PREFS;
  }
}

export function savePanelNotificationPrefs(
  panel: PanelKind,
  prefs: PanelNotificationPrefs,
  portalScope?: string,
): void {
  window.localStorage.setItem(storageKeyForPanel(panel, portalScope), JSON.stringify(prefs));
}

export function soundUrlForPrefs(prefs: PanelNotificationPrefs): string {
  return NOTIFICATION_TONES.find((t) => t.id === prefs.tone)?.url ?? '/notification.mp3';
}

export function prefsForServiceWorker(prefs: PanelNotificationPrefs) {
  return {
    sound: prefs.sound,
    vibration: prefs.vibration,
    badge: prefs.badge,
    soundUrl: soundUrlForPrefs(prefs),
  };
}

export async function syncNotificationPrefsToServiceWorker(
  prefs: PanelNotificationPrefs,
): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({
    type: 'SET_NOTIFICATION_PREFS',
    prefs: prefsForServiceWorker(prefs),
  });
}

export async function clearPanelAppBadge(): Promise<void> {
  if ('clearAppBadge' in navigator) {
    await navigator.clearAppBadge().catch(() => {});
  }
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'CLEAR_BADGE' });
  }
}
