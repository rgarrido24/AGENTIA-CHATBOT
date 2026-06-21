import { NextRequest, NextResponse } from 'next/server';

export const ANUARIO_K3_PUBLIC_PREFIX = '/anuariok3asbaje';

const DEFAULT_UPSTREAM = 'https://anuario-k3-git-main-rgos-projects-0215a8f4.vercel.app';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function upstreamOrigin(): string {
  return (process.env.ANUARIO_K3_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, '');
}

function upstreamHostname(): string {
  return new URL(upstreamOrigin()).hostname;
}

function bypassSecret(): string | undefined {
  const s =
    process.env.ANUARIO_VERCEL_BYPASS_SECRET ||
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    '';
  return s.trim() || undefined;
}

export function anuarioPathFromPathname(pathname: string): string {
  if (!pathname.startsWith(ANUARIO_K3_PUBLIC_PREFIX)) return '';
  return pathname
    .slice(ANUARIO_K3_PUBLIC_PREFIX.length)
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

/** Location puede ser /dashboard/ o /anuariok3asbaje/dashboard/ — mapear a URL upstream. */
function stripPublicPrefix(pathname: string): string {
  if (pathname.startsWith(ANUARIO_K3_PUBLIC_PREFIX)) {
    const rest = pathname.slice(ANUARIO_K3_PUBLIC_PREFIX.length) || '/';
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function resolveUpstreamRedirectLocation(location: string, currentUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(location, currentUrl);
  } catch {
    return null;
  }

  if (parsed.hostname !== upstreamHostname()) return null;

  const upstreamPath = stripPublicPrefix(parsed.pathname);
  return `${upstreamOrigin()}${upstreamPath}${parsed.search}${parsed.hash}`;
}

function normalizeVisitKey(url: string): string {
  try {
    const u = new URL(url);
    let p = u.pathname;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return `${u.hostname}${p}${u.search}`;
  } catch {
    return url;
  }
}

function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

function rewriteAnuarioBody(text: string): string {
  const origin = upstreamOrigin();
  const host = upstreamHostname();
  const prefix = ANUARIO_K3_PUBLIC_PREFIX;

  let out = text
    .replaceAll(origin, prefix)
    .replaceAll(`https://${host}`, prefix)
    .replaceAll(`http://${host}`, prefix)
    .replaceAll(`//${host}`, prefix);

  out = out.replace(
    /https:\/\/vercel\.com\/sso-api\?url=https%3A%2F%2F[^"&]+/g,
    `${prefix}/dashboard`
  );

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
  'location',
]);

function upstreamUrlCandidates(path: string, search: string): string[] {
  const base = upstreamOrigin();
  const p = path.replace(/^\/+|\/+$/g, '');
  const q = search || '';
  const urls: string[] = [];
  if (p) {
    urls.push(`${base}/${p}${q}`, `${base}/${p}/${q}`);
  } else {
    urls.push(`${base}/${q}`);
  }
  return [...new Set(urls)];
}

/** Sigue 307/308 (y otros 3xx) solo dentro del host Vercel; nunca devuelve redirect al cliente. */
async function fetchUpstreamFinal(url: string, init: RequestInit): Promise<Response> {
  const visited = new Set<string>();
  let current = url;

  for (let hop = 0; hop < 15; hop++) {
    const key = normalizeVisitKey(current);
    if (visited.has(key)) break;
    visited.add(key);

    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (!isRedirectStatus(res.status)) return res;

    const loc = res.headers.get('location');
    if (!loc) return res;

    const next = resolveUpstreamRedirectLocation(loc, current);
    if (!next) return res;
    current = next;
  }

  return fetch(current, { ...init, redirect: 'manual' });
}

async function resolveUpstreamResponse(
  path: string,
  search: string,
  init: RequestInit
): Promise<Response | null> {
  let lastRes: Response | null = null;

  for (const candidate of upstreamUrlCandidates(path, search)) {
    try {
      const res = await fetchUpstreamFinal(candidate, init);
      lastRes = res;
      if (!isRedirectStatus(res.status)) return res;

      const loc = res.headers.get('location');
      const next = loc ? resolveUpstreamRedirectLocation(loc, candidate) : null;
      if (next) {
        const followed = await fetchUpstreamFinal(next, init);
        lastRes = followed;
        if (!isRedirectStatus(followed.status)) return followed;
      }
    } catch {
      /* siguiente candidato */
    }
  }

  return lastRes;
}

/** Proxy transparente: fetch a Vercel, reescribe URLs, sin redirects al cliente. */
export async function proxyAnuarioK3Request(
  req: NextRequest,
  path: string
): Promise<NextResponse> {
  try {
    const search = req.nextUrl.search;
    const headers = new Headers();
    headers.set('accept', req.headers.get('accept') || '*/*');
    const ua = req.headers.get('user-agent');
    if (ua) headers.set('user-agent', ua);

    const bypass = bypassSecret();
    if (bypass) {
      headers.set('x-vercel-protection-bypass', bypass);
      headers.set('x-vercel-set-bypass-cookie', 'true');
    }

    const init: RequestInit = {
      method: req.method === 'HEAD' ? 'HEAD' : req.method,
      headers,
      redirect: 'manual',
    };

    let upstreamRes = await resolveUpstreamResponse(path, search, init);

    if (!upstreamRes) {
      return NextResponse.json({ error: 'No se pudo conectar al anuario upstream' }, { status: 502 });
    }

    // Último intento: si sigue en 307/308, seguir Location una vez más (solo Vercel)
    if (isRedirectStatus(upstreamRes.status)) {
      const loc = upstreamRes.headers.get('location');
      const base = upstreamUrlCandidates(path, search)[0];
      const next = loc && base ? resolveUpstreamRedirectLocation(loc, base) : null;
      if (next) {
        upstreamRes = await fetchUpstreamFinal(next, init);
      }
    }

    // Nunca reenviar redirects al navegador
    if (isRedirectStatus(upstreamRes.status)) {
      const body = await upstreamRes.text().catch(() => '');
      if (body) {
        return new NextResponse(rewriteAnuarioBody(body), {
          status: 200,
          headers: {
            'content-type': upstreamRes.headers.get('content-type') || 'text/html; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
      }
      return NextResponse.json({ error: 'Upstream devolvió redirect sin contenido' }, { status: 502 });
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
      if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
      outHeaders.set(key, value);
    });

    if (rewriteBody) {
      const text = rewriteAnuarioBody(await upstreamRes.text());
      outHeaders.delete('content-length');
      return new NextResponse(text, { status: upstreamRes.status, headers: outHeaders });
    }

    const buf = await upstreamRes.arrayBuffer();
    outHeaders.delete('content-length');
    return new NextResponse(buf, { status: upstreamRes.status, headers: outHeaders });
  } catch (e) {
    console.error('[anuario-k3-proxy] error:', e instanceof Error ? e.stack || e.message : e);
    return NextResponse.json({ error: 'Error interno del proxy anuario' }, { status: 500 });
  }
}
