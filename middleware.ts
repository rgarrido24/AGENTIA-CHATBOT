import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractClientPanelToken, getExpectedClientPanelToken } from '@/lib/client-panel-auth';

const COOKIE_NAME = 'admin_auth';
const AUTH_SALT = 'agentia_admin_salt';

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── In-Edge rate limiter ────────────────────────────────────────────────────
// Store lives per Edge worker instance. Good enough for single-server deploys.
type REntry = { hits: number; resetAt: number };
const RL_STORE = new Map<string, REntry>();

function edgeRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = RL_STORE.get(key);
  if (!entry || entry.resetAt < now) {
    RL_STORE.set(key, { hits: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.hits >= limit) return false;
  entry.hits++;
  return true;
}

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

// ─── CRON_SECRET validation ───────────────────────────────────────────────────
function hasCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false; // secret not configured → block all
  const authHeader = req.headers.get('authorization');
  const queryToken = req.nextUrl.searchParams.get('secret');
  return authHeader === `Bearer ${cronSecret}` || queryToken === cronSecret;
}

// ─── Bot UA patterns ─────────────────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  /curl\//i, /wget\//i, /python-requests/i, /go-http-client/i,
  /java\/\d/i, /scrapy/i, /mechanize/i, /nikto/i, /nmap/i,
  /masscan/i, /zgrab/i, /sqlmap/i, /hydra/i, /libwww-perl/i,
  /python-requests|scrapy|wget|libwww|zgrab|masscan|nuclei/i,
];
// SEO crawlers we WANT to allow
const ALLOWED_BOTS = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebookplatform|twitterbot|linkedinbot|whatsapp/i;

function isMaliciousBot(ua: string | null): boolean {
  if (!ua || ua.trim().length === 0) return true;
  if (ALLOWED_BOTS.test(ua)) return false;
  return BOT_UA_PATTERNS.some((p) => p.test(ua));
}

async function logBlocked(req: NextRequest, ip: string): Promise<void> {
  try {
    fetch(new URL('/api/security/log-blocked', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, ua: req.headers.get('user-agent'), path: req.nextUrl.pathname }),
    }).catch(() => {});
  } catch { /* fire-and-forget */ }
}

function handleClientPanelAuth(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const panelPage = pathname.match(/^\/clientes\/([^/]+)\/panel/);
  const panelApi = pathname.match(/^\/api\/panel\/([^/]+)/);
  const clientId = (panelPage?.[1] || panelApi?.[1] || '').toLowerCase();
  if (!clientId) return null;

  const expected = getExpectedClientPanelToken(clientId);
  if (!expected) {
    if (panelApi) {
      return NextResponse.json({ error: 'Panel no configurado para este cliente' }, { status: 503 });
    }
    return new NextResponse('Panel no configurado', { status: 503 });
  }

  const token = extractClientPanelToken(request);
  if (!token || token !== expected) {
    if (panelPage && request.nextUrl.searchParams.get('auth') === 'required') {
      return NextResponse.next();
    }
    if (panelApi) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/clientes/${clientId}/panel`;
    loginUrl.searchParams.set('auth', 'required');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = clientIP(request);

  // ── Disable caching for /brief (conversion flow) ───────────────────────────
  if (pathname === '/brief' || pathname.startsWith('/brief/')) {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  // Brief público por slug: ?clientSlug= → /portal/luciano/brief/{slug} (compat)
  if (pathname === '/portal/luciano/brief') {
    const raw = request.nextUrl.searchParams.get('clientSlug')?.trim().toLowerCase() ?? '';
    if (raw && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) && raw.length <= 80) {
      const url = request.nextUrl.clone();
      url.pathname = `/portal/luciano/brief/${raw}`;
      url.searchParams.delete('clientSlug');
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/portal/luciano/brief')) {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  // ── Cron interno (Bearer o ?secret=) — antes del bloqueo por UA vacío (Vercel Cron) ──
  if (pathname.startsWith('/api/cron/') && hasCronSecret(request)) {
    return NextResponse.next();
  }

  // ── Webhooks Meta/WhatsApp: sin bloqueo por User-Agent (suele venir vacío o genérico) ──
  if (pathname.startsWith('/api/webhook/')) {
    return NextResponse.next();
  }

  if (pathname === '/api/dashboard/auth/login') {
    return NextResponse.next();
  }

  const clientPanelResponse = handleClientPanelAuth(request);
  if (clientPanelResponse) return clientPanelResponse;

  // ── Bot blocking on API routes ────────────────────────────────────────────
  if (pathname.startsWith('/api/') && isMaliciousBot(request.headers.get('user-agent'))) {
    await logBlocked(request, ip);
    return new NextResponse(null, { status: 403 });
  }

  // ── Rate limiting: /api/agentia/followup (CRON_SECRET only) ─────────────────
  if (pathname.startsWith('/api/agentia/followup')) {
    if (!hasCronSecret(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Rate limiting: /api/auth/login (10 per 5 min per IP) ───────────────────
  if (pathname === '/api/dashboard/auth/login') {
    return NextResponse.next();
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const allowed = edgeRateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en 5 minutos.' },
        { status: 429 }
      );
    }
  }

  // ── Rate limiting: /api/chat (30 per min per IP) ─────────────────────────────
  if (pathname === '/api/chat' && request.method === 'POST') {
    const allowed = edgeRateLimit(`chat:${ip}`, 30, 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 });
    }
  }

  // ── Rate limiting: /api/demo/* (20 per min per IP) ───────────────────────────
  if (pathname.startsWith('/api/demo/') && request.method === 'POST') {
    const allowed = edgeRateLimit(`demo:${ip}`, 20, 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 });
    }
  }

  // ── Rate limiting: /api/brief/diagnostic (12 per 5 min per IP) ──────────────
  if (pathname === '/api/brief/diagnostic' && request.method === 'POST') {
    const allowed = edgeRateLimit(`brief:${ip}`, 12, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en 5 minutos.' }, { status: 429 });
    }
  }

  // ── Auth: dashboard + CWF panel + Agentia panel ─────────────────────────────
  const isDashboardPage = pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login');
  const isDashboardApi =
    pathname.startsWith('/api/dashboard') && pathname !== '/api/dashboard/auth/login';
  const isCwfPanelPage  = pathname.startsWith('/cwf-panel') && !pathname.startsWith('/cwf-panel/login');
  const isCwfPanelApi   = pathname.startsWith('/api/cwf-panel');
  const isAgentiaPanelPage =
    pathname.startsWith('/agentia-panel') && !pathname.startsWith('/agentia-panel/login');
  const isAgentiaPanelApi = pathname.startsWith('/api/agentia-panel');

  if (
    isDashboardPage ||
    isDashboardApi ||
    isCwfPanelPage ||
    isCwfPanelApi ||
    isAgentiaPanelPage ||
    isAgentiaPanelApi
  ) {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
      if (isDashboardApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }
    const dashToken    = request.cookies.get('dashboard_auth')?.value;
    const adminToken   = request.cookies.get('admin_auth')?.value;
    const dashExpected = await sha256Hex(adminUser + ':' + adminPass + 'agentia_dashboard_v2');
    const adminExpected = await sha256Hex(adminPass + 'agentia_admin_salt');

    const okDashboard = !!dashToken && dashToken === dashExpected;
    const okAdmin = !!adminToken && adminToken === adminExpected;

    if (!okDashboard && !okAdmin) {
      if (isDashboardApi || isCwfPanelApi || isAgentiaPanelApi) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      const loginUrl = new URL(
        isAgentiaPanelPage || isAgentiaPanelApi
          ? '/agentia-panel/login'
          : isCwfPanelPage || isCwfPanelApi
            ? '/cwf-panel/login'
            : '/dashboard/login',
        request.url
      );
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Auth: admin ───────────────────────────────────────────────────────────────
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  = pathname.startsWith('/api/admin');
  const isProtected = isAdminPage || isAdminApi;

  if (!isProtected) {
    return NextResponse.next();
  }

  const token  = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    if (isAdminApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const expected = await sha256Hex(secret + AUTH_SALT);
  if (!token || token !== expected) {
    if (isAdminApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/brief/:path*',
    '/portal/luciano/brief/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/cwf-panel/:path*',
    '/agentia-panel/:path*',
    '/api/admin/:path*',
    '/api/dashboard/:path*',
    '/api/cwf-panel/:path*',
    '/api/agentia-panel/:path*',
    '/api/panel/:path*',
    '/clientes/:clientId/panel/:path*',
    '/api/chat',
    '/api/demo/:path*',
    '/api/brief/diagnostic',
    '/api/agentia/followup',
    '/api/auth/login',
  ],
};
