import { NextRequest, NextResponse } from 'next/server';

export const ANUARIO_K3_PUBLIC_PREFIX = '/anuariok3asbaje';

const DEFAULT_UPSTREAM = 'https://anuario-k3-git-main-rgos-projects-0215a8f4.vercel.app';

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
  return pathname.slice(ANUARIO_K3_PUBLIC_PREFIX.length).replace(/^\//, '');
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
  const urls = [
    p ? `${base}/${p}${q}` : `${base}/${q}`,
    p ? `${base}/${p}/${q}` : `${base}/${q}`,
  ];
  return [...new Set(urls)];
}

async function fetchUpstreamFinal(url: string, init: RequestInit): Promise<Response> {
  const allowedHost = upstreamHostname();
  const visited = new Set<string>();
  let current = url;

  for (let hop = 0; hop < 10; hop++) {
    if (visited.has(current)) break;
    visited.add(current);

    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(res.status)) return res;

    const loc = res.headers.get('location');
    if (!loc) return res;

    let next: string;
    try {
      next = new URL(loc, current).href;
    } catch {
      return res;
    }

    if (new URL(next).hostname !== allowedHost) return res;
    current = next;
  }

  return fetch(current, { ...init, redirect: 'manual' });
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

    let upstreamRes: Response | null = null;
    for (const candidate of upstreamUrlCandidates(path, search)) {
      try {
        const res = await fetchUpstreamFinal(candidate, init);
        upstreamRes = res;
        if (![301, 302, 303, 307, 308].includes(res.status)) break;
      } catch {
        /* probar siguiente candidato */
      }
    }

    if (!upstreamRes) {
      return NextResponse.json({ error: 'No se pudo conectar al anuario upstream' }, { status: 502 });
    }

    // Nunca reenviar redirects al navegador (evita loops)
    if ([301, 302, 303, 307, 308].includes(upstreamRes.status)) {
      const body = await upstreamRes.text().catch(() => '');
      if (body) {
        return new NextResponse(rewriteAnuarioBody(body), {
          status: 200,
          headers: { 'content-type': upstreamRes.headers.get('content-type') || 'text/html; charset=utf-8' },
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
