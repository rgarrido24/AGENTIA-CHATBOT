'use client';

import { useEffect } from 'react';

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
    userAgent: navigator.userAgent,
    ...extra,
  };
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function useAnalytics(demo?: string) {
  useEffect(() => {
    const start = Date.now();

    track('pageview', demo);

    const handleUnload = () => {
      const seconds = Math.round((Date.now() - start) / 1000);
      const payload = JSON.stringify({
        page: window.location.pathname,
        demo: demo ?? null,
        event: 'time_spent',
        seconds,
        referrer: document.referrer || null,
        dispositivo: getDevice(),
        navegador: getBrowser(),
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [demo]);
}
