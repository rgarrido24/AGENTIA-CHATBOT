/** Manifest y service worker de un restaurante (PWA instalable, alcance /<slug>). */
import { NextResponse } from 'next/server';
import type { RestauranteConfig } from './config';

export function manifestCliente(cfg: RestauranteConfig) {
  const m = cfg.marca;
  return NextResponse.json(
    {
      id: cfg.ruta,
      name: m.nombre,
      short_name: m.nombre,
      description: `Menú, pedidos y tarjeta de lealtad de ${m.nombre}.`,
      start_url: `${cfg.ruta}?src=pwa`,
      scope: cfg.ruta,
      display: 'standalone',
      orientation: 'any',
      background_color: m.fondoManifest,
      theme_color: m.themeColor,
      icons: iconos(cfg),
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}

export function manifestEquipo(cfg: RestauranteConfig) {
  const m = cfg.marca;
  return NextResponse.json(
    {
      id: `${cfg.ruta}/equipo`,
      name: `${m.nombre} Equipo`,
      short_name: 'Equipo',
      description: `Mesero, cocina, barra, caja y dueño de ${m.nombre}.`,
      start_url: `${cfg.ruta}/equipo?src=pwa`,
      scope: `${cfg.ruta}/equipo`,
      display: 'standalone',
      orientation: 'any',
      background_color: m.fondoManifest,
      theme_color: m.themeColorEquipo,
      icons: iconos(cfg),
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}

function iconos(cfg: RestauranteConfig) {
  const m = cfg.marca;
  return [
    { src: m.icono192, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: m.icono512, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: m.iconoMaskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
}

/**
 * Service worker (alcance /<slug>/).
 * - Páginas: red primero; si no hay internet, la última copia guardada.
 * - Archivos estáticos de Next, fuentes e imágenes: caché primero.
 * - Nunca guarda /api/ (pedidos, cobros y sesiones siempre van en vivo).
 */
export function swResponse(cfg: RestauranteConfig) {
  const r = cfg.ruta;
  const SW = `
const V = '${cfg.slug}-v4';
const SHELL = ['${r}', '${r}/equipo', '${cfg.marca.icono192}', '${cfg.marca.logo}'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.title || '${cfg.marca.nombre}', {
    body: d.body || '',
    icon: '${cfg.marca.icono192}',
    badge: '${cfg.marca.icono192}',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    vibrate: [220, 100, 220],
    silent: false,
    requireInteraction: true,
    data: { url: d.url || '${r}/equipo' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const u = (e.notification.data && e.notification.data.url) || '${r}/equipo';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if (c.url.indexOf('${r}/equipo') !== -1 && 'focus' in c) return c.focus(); }
    return clients.openWindow(u);
  }));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match('${r}')))
    );
    return;
  }
  if (/\\.(png|jpg|jpeg|webp|svg)$/.test(url.pathname)) {
    // Imágenes del restaurante (logo, fotos): se muestran de la copia guardada y se refrescan en segundo plano.
    e.respondWith(
      caches.open(V).then((c) => c.match(req).then((m) => {
        const red = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => m);
        return m || red;
      }))
    );
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || /\\.woff2?$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); } return r; }))
    );
  }
});
`;
  return new Response(SW, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': r,
    },
  });
}
