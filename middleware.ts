import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
const ALLOWED_BOTS = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i;

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

  // ── Auth: dashboard ──────────────────────────────────────────────────────────
  const isDashboardPage = pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login');
  const isDashboardApi  = pathname.startsWith('/api/dashboard');

  if (isDashboardPage || isDashboardApi) {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
      if (isDashboardApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }
    const dashToken    = request.cookies.get('dashboard_auth')?.value;
    const dashExpected = await sha256Hex(adminUser + ':' + adminPass + 'agentia_dashboard_v2');
    if (!dashToken || dashToken !== dashExpected) {
      if (isDashboardApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      const loginUrl = new URL('/dashboard/login', request.url);
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
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/dashboard/:path*',
    '/api/chat',
    '/api/demo/:path*',
    '/api/brief/diagnostic',
    '/api/agentia/followup',
    '/api/auth/login',
  ],
};
