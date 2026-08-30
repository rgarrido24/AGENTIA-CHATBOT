'use client';

const KEY = 'client_panel_token';

export function getPanelTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('token');
  if (fromUrl) {
    sessionStorage.setItem(KEY, fromUrl);
    return fromUrl;
  }
  return sessionStorage.getItem(KEY);
}

export function panelHeaders(): HeadersInit {
  const token = getPanelTokenFromUrl();
  return token ? { 'x-client-token': token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function panelFetch(clientId: string, path: string, init?: RequestInit) {
  const headers = { ...panelHeaders(), ...(init?.headers as Record<string, string>) };
  const res = await fetch(`/api/panel/${clientId}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Error ${res.status}`);
  }
  return res.json();
}

export function relativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
