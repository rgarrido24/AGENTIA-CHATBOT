import { NextRequest, NextResponse } from 'next/server';

export const ANUARIO_K3_PUBLIC_PREFIX = '/anuariok3asbaje';

const DEFAULT_UPSTREAM = 'https://anuario-k3-git-main-rgos-projects-0215a8f4.vercel.app';

function upstreamOrigin(): string {
  return (process.env.ANUARIO_K3_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, '');
}

/** Origen público con protocolo (Render a veces tiene solo el host sin https://). */
function publicOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://agentia.software').trim().replace(/\/$/, '');
  if (!raw) return 'https://agentia.software';
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).origin;
  } catch {
    return 'https://agentia.software';
  }
}

function upstreamHost(): string {
  return new URL(upstreamOrigin()).host;
}

function bypassSecret(): string | undefined {
  const s =
    process.env.ANUARIO_VERCEL_BYPASS_SECRET ||
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    '';
  return s.trim() || undefined;
}

/** Reescribe URLs del upstream / Vercel → agentia.software/anuariok3asbaje */
export function rewriteAnuarioPublicUrl(url: string): string {
  if (!url) return url;
  const origin = upstreamOrigin();
  const host = upstreamHost();
  const pub = publicOrigin();
  const prefix = ANUARIO_K3_PUBLIC_PREFIX;

  if (url.startsWith(origin)) {
    const rest = url.slice(origin.length) || '/';
    return `${pub}${prefix}${rest.startsWith('/') ? rest : `/${rest}`}`;
  }

  if (url.startsWith(`https://${host}`) || url.startsWith(`http://${host}`)) {
    const u = new URL(url);
    return `${pub}${prefix}${u.pathname}${u.search}${u.hash}`;
  }

  // Rutas absolutas del app Next en Vercel (/_next, /dashboard, etc.)
  if (url.startsWith('/') && !url.startsWith(prefix)) {
    return `${prefix}${url}`;
  }

  return url;
}

function rewriteAnuarioBody(text: string): string {
  const origin = upstreamOrigin();
  const host = upstreamHost();
  const pub = publicOrigin();
  const prefix = ANUARIO_K3_PUBLIC_PREFIX;
  const pubBase = `${pub}${prefix}`;

  let out = text
    .replaceAll(origin, pubBase)
    .replaceAll(`https://${host}`, pubBase)
    .replaceAll(`http://${host}`, pubBase)
    .replaceAll(`//${host}`, `//${new URL(publicOrigin()).host}${prefix}`);

  // SSO / redirects embebidos de Vercel Protection
  out = out.replace(
    /https:\/\/vercel\.com\/sso-api\?url=https%3A%2F%2F[^"&]+/g,
    `${pubBase}/dashboard`
  );

  // Assets y rutas Next en el HTML/JS del upstream (servido en /)
  out = out.replaceAll('"/_next/', `"${prefix}/_next/`);
  out = out.replaceAll("'/_next/", `'${prefix}/_next/`);
  out = out.replaceAll('href="/', `href="${prefix}/`);
  out = out.replaceAll("href='/", `href='${prefix}/`);

  return out;
}

const SKIP_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
]);

function isInternalHost(host: string): boolean {
  const h = host.split(':')[0].toLowerCase();
  return (
    h === '0.0.0.0' ||
    h === '127.0.0.1' ||
    h === 'localhost' ||
    h.startsWith('10.') ||
    h.startsWith('192.168.') ||
    h.endsWith('.internal')
  );
}

/** Origen público real de la petición (Render escucha en 0.0.0.0:10000). */
function requestPublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const hostHeader = req.headers.get('host')?.split(',')[0]?.trim();
  const host = forwardedHost || hostHeader;

  if (host && !isInternalHost(host)) {
    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return `${proto}://${host}`;
  }

  return publicOrigin();
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

function isSamePublicPath(req: NextRequest, targetHref: string): boolean {
  try {
    return normalizePathname(req.nextUrl.pathname) === normalizePathname(new URL(targetHref).pathname);
  } catch {
    return false;
  }
}

function absoluteRedirectUrl(req: NextRequest, rewritten: string): string {
  if (/^https?:\/\//i.test(rewritten)) return rewritten;
  return new URL(rewritten, requestPublicOrigin(req)).href;
}


function resolveUpstreamUrl(location: string, fromUrl: string): string | null {
  if (/^https?:\/\//i.test(location)) {
    try {
      const loc = new URL(location);
      const upstream = new URL(upstreamOrigin());
      if (loc.hostname !== upstream.hostname) return null;
      return loc.href;
    } catch {
      return null;
    }
  }
  return new URL(location, fromUrl).href;
}

async function fetchUpstream(url: string, init: RequestInit): Promise<Response> {
  const visited = new Set<string>();
  let current = url;

  for (let hop = 0; hop < 10; hop++) {
    if (visited.has(current)) break;
    visited.add(current);

    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(res.status)) return res;

    const loc = res.headers.get('location');
    if (!loc) return res;

    const next = resolveUpstreamUrl(loc, current);
    if (!next) return res;
    current = next;
  }

  return fetch(current, { ...init, redirect: 'manual' });
}

export async function proxyAnuarioK3Request(
  req: NextRequest,
  pathSegments: string[] | undefined
): Promise<NextResponse> {
  try {
  const path = (pathSegments || []).filter(Boolean).join('/');
  const upstreamUrl = `${upstreamOrigin()}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const forward = [
    'accept',
    'accept-language',
    'accept-encoding',
    'content-type',
    'cache-control',
    'if-none-match',
    'if-modified-since',
    'range',
    'user-agent',
  ];
  for (const name of forward) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }

  const bypass = bypassSecret();
  if (bypass) {
    headers.set('x-vercel-protection-bypass', bypass);
    headers.set('x-vercel-set-bypass-cookie', 'true');
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetchUpstream(upstreamUrl, init);
  } catch (e) {
    console.error('[anuario-k3-proxy] fetch error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'No se pudo conectar al anuario upstream' }, { status: 502 });
  }

  if ([301, 302, 303, 307, 308].includes(upstreamRes.status)) {
    const loc = upstreamRes.headers.get('location');
    if (loc) {
      const target = absoluteRedirectUrl(req, rewriteAnuarioPublicUrl(loc));
      if (!isSamePublicPath(req, target)) {
        return NextResponse.redirect(target, upstreamRes.status);
      }
      const altPath = path.endsWith('/') ? path.replace(/\/$/, '') : `${path}/`;
      try {
        upstreamRes = await fetchUpstream(`${upstreamOrigin()}/${altPath}${req.nextUrl.search}`, init);
      } catch {
        /* mantener respuesta anterior */
      }
    }
  }

  const contentType = upstreamRes.headers.get('content-type') || '';
  const rewriteBody =
    req.method !== 'HEAD' &&
    (contentType.includes('text/html') ||
      contentType.includes('javascript') ||
      contentType.includes('json') ||
      contentType.includes('text/css') ||
      contentType.includes('application/javascript'));

  const outHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (SKIP_RESPONSE_HEADERS.has(k)) return;
    if (k === 'location') {
      const abs = absoluteRedirectUrl(req, rewriteAnuarioPublicUrl(value));
      if (!isSamePublicPath(req, abs)) {
        outHeaders.set('location', abs);
      }
      return;
    }
    outHeaders.set(key, value);
  });

  if (rewriteBody) {
    const text = rewriteAnuarioBody(await upstreamRes.text());
    outHeaders.delete('content-length');
    return new NextResponse(text, { status: upstreamRes.status, headers: outHeaders });
  }

  return new NextResponse(upstreamRes.body, { status: upstreamRes.status, headers: outHeaders });
  } catch (e) {
    console.error('[anuario-k3-proxy] error:', e instanceof Error ? e.stack || e.message : e);
    return NextResponse.json({ error: 'Error interno del proxy anuario' }, { status: 500 });
  }
}
