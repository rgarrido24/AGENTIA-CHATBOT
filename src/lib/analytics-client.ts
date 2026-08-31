'use client';

import { useEffect, useMemo, useState } from 'react';

let _sessionId: string | null = null;

function safeSessionGet(key: string): string | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeLocalGet(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  let id = safeSessionGet('agentia_sid');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    safeSessionSet('agentia_sid', id);
  }
  _sessionId = id;
  return id;
}

const VISITOR_COOKIE = 'agentia_vid';
const ADMIN_LS_KEY = 'agentia_admin';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&')}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function getOrCreateVisitorId(): string {
  const existing = getCookie(VISITOR_COOKIE);
  if (existing) return existing;
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  // 30 días
  setCookie(VISITOR_COOKIE, id, 60 * 60 * 24 * 30);
  return id;
}

function detectAndPersistAdminFlag(searchParams: URLSearchParams): boolean {
  if (typeof window === 'undefined') return false;

  const already = safeLocalGet(ADMIN_LS_KEY) === '1';
  const hasParam = searchParams.get('admin') === 'true';
  if (already) return true;
  if (!hasParam) return false;

  safeLocalSet(ADMIN_LS_KEY, '1');

  // Quitar ?admin=true de la URL (solo una vez)
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  } catch {
    // best-effort
  }

  return true;
}

function getCurrentSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

function getCurrentPathname(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

function getDevice(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua) && !/chromium/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/opr\//i.test(ua)) return 'Opera';
  return 'Otro';
}

function getTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function getLanguage(): string | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.language || (navigator.languages?.[0] ?? null);
}

function getScreen(): { screenW: number | null; screenH: number | null; pixelRatio: number | null } {
  if (typeof window === 'undefined' || !window.screen) {
    return { screenW: null, screenH: null, pixelRatio: null };
  }
  return {
    screenW: window.screen.width || null,
    screenH: window.screen.height || null,
    pixelRatio: typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : null,
  };
}

function buildClientMeta() {
  const { screenW, screenH, pixelRatio } = getScreen();
  return {
    dispositivo: getDevice(),
    navegador: getBrowser(),
    userAgent: navigator.userAgent,
    idioma: getLanguage(),
    timezone: getTimezone(),
    screenW,
    screenH,
    pixelRatio,
  };
}

function track(event: string, demo: string | undefined, extra: Record<string, unknown> = {}) {
  const payload = {
    page: window.location.pathname,
    demo: demo ?? null,
    event,
    referrer: document.referrer || null,
    sessionId: getSessionId(),
    visitorId: getOrCreateVisitorId(),
    ...buildClientMeta(),
    ...extra,
  };
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export type VisitorStatus = {
  visitorId: string;
  isNew: boolean;
  visits: number;
  ref: string | null;
  pais: string | null;
  ciudad: string | null;
};

export function useVisitorStatus(): { status: VisitorStatus | null; admin: boolean } {
  const [status, setStatus] = useState<VisitorStatus | null>(null);

  const admin = useMemo(
    () => detectAndPersistAdminFlag(getCurrentSearchParams()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (admin) {
      setStatus(null);
      return;
    }

    const sp = getCurrentSearchParams();
    const ref = sp.get('ref');
    const payload = {
      page: getCurrentPathname(),
      ref: ref || null,
      visitorId: getOrCreateVisitorId(),
      sessionId: getSessionId(),
      ...buildClientMeta(),
    };

    fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (r) => (await r.json().catch(() => null)) as VisitorStatus | null)
      .then((d) => {
        if (!d || !d.visitorId) return;
        setStatus(d);
        try {
          safeSessionSet('agentia_visitor_status', JSON.stringify(d));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, [admin]);

  return { status, admin };
}

export function trackEvent(event: string, demo?: string, extra: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (safeLocalGet(ADMIN_LS_KEY) === '1') return;
  track(event, demo, extra);
}

export function useAnalytics(demo?: string) {
  useEffect(() => {
    const start = Date.now();

    const sp = getCurrentSearchParams();
    const admin = detectAndPersistAdminFlag(sp);
    if (!admin) {
      track('pageview', demo, { ref: sp.get('ref') || null });
    }

    const handleUnload = () => {
      const seconds = Math.round((Date.now() - start) / 1000);
      const sp = getCurrentSearchParams();
      const admin = detectAndPersistAdminFlag(sp);
      if (admin) return;
      const payload = JSON.stringify({
        page: getCurrentPathname(),
        demo: demo ?? null,
        event: 'time_spent',
        seconds,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
        visitorId: getOrCreateVisitorId(),
        ref: sp.get('ref') || null,
        ...buildClientMeta(),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [demo]);
}
