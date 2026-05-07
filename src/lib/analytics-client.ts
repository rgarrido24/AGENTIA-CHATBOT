'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof sessionStorage !== 'undefined') {
    let id = sessionStorage.getItem('agentia_sid');
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('agentia_sid', id);
    }
    _sessionId = id;
    return id;
  }
  _sessionId = `ssr-${Date.now()}`;
  return _sessionId;
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

  const already = window.localStorage.getItem(ADMIN_LS_KEY) === '1';
  const hasParam = searchParams.get('admin') === 'true';
  if (already) return true;
  if (!hasParam) return false;

  window.localStorage.setItem(ADMIN_LS_KEY, '1');

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

function track(event: string, demo: string | undefined, extra: Record<string, unknown> = {}) {
  const payload = {
    page: window.location.pathname,
    demo: demo ?? null,
    event,
    referrer: document.referrer || null,
    dispositivo: getDevice(),
    navegador: getBrowser(),
    sessionId: getSessionId(),
    visitorId: getOrCreateVisitorId(),
    userAgent: navigator.userAgent,
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VisitorStatus | null>(null);

  const admin = useMemo(
    () => detectAndPersistAdminFlag(new URLSearchParams(searchParams.toString())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );

  useEffect(() => {
    if (admin) {
      setStatus(null);
      return;
    }

    const ref = searchParams.get('ref');
    const payload = {
      page: pathname,
      ref: ref || null,
      visitorId: getOrCreateVisitorId(),
      sessionId: getSessionId(),
      dispositivo: getDevice(),
      navegador: getBrowser(),
      userAgent: navigator.userAgent,
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
          sessionStorage.setItem('agentia_visitor_status', JSON.stringify(d));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, [admin, pathname, searchParams]);

  return { status, admin };
}

export function useAnalytics(demo?: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const start = Date.now();

    const admin = detectAndPersistAdminFlag(new URLSearchParams(searchParams.toString()));
    if (!admin) {
      track('pageview', demo, { ref: searchParams.get('ref') || null });
    }

    const handleUnload = () => {
      const seconds = Math.round((Date.now() - start) / 1000);
      const admin = detectAndPersistAdminFlag(new URLSearchParams(searchParams.toString()));
      if (admin) return;
      const payload = JSON.stringify({
        page: pathname,
        demo: demo ?? null,
        event: 'time_spent',
        seconds,
        referrer: document.referrer || null,
        dispositivo: getDevice(),
        navegador: getBrowser(),
        sessionId: getSessionId(),
        visitorId: getOrCreateVisitorId(),
        ref: searchParams.get('ref') || null,
        userAgent: navigator.userAgent,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [demo, pathname, searchParams]);
}
