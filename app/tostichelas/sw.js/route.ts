export const dynamic = 'force-static';

/**
 * Service worker de Tostichelas (alcance /tostichelas/).
 * - Páginas: red primero; si no hay internet, la última copia guardada.
 * - Archivos estáticos de Next, fuentes e imágenes: caché primero.
 * - Nunca guarda /api/ (pedidos, cobros y sesiones siempre van en vivo).
 */
const SW = `
const V = 'tostichelas-v1';
const SHELL = ['/tostichelas', '/tostichelas/equipo', '/tostichelas/icon-192.png', '/tostichelas/logo.jpg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match('/tostichelas')))
    );
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || /\\.(woff2?|png|jpg|jpeg|webp|svg)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); } return r; }))
    );
  }
});
`;

export function GET() {
  return new Response(SW, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/tostichelas',
    },
  });
}
