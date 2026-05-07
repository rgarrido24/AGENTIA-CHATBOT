import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

function bestIp(req: NextRequest): string {
  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('x-real-ip'),
    req.headers.get('x-vercel-forwarded-for'),
    req.headers.get('x-forwarded-for'),
  ]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  return candidates[0] ?? 'unknown';
}

function headerGeo(req: NextRequest): { pais?: string; ciudad?: string } {
  const country =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    undefined;
  const city = req.headers.get('x-vercel-ip-city') || undefined;
  const pais = country && country !== 'XX' ? country : undefined;
  return { pais, ciudad: city };
}

async function geoLookup(ip: string, fallback: { pais?: string; ciudad?: string }): Promise<{ pais: string; ciudad: string }> {
  if (fallback.pais || fallback.ciudad) {
    return {
      pais: fallback.pais ?? 'Desconocido',
      ciudad: fallback.ciudad ?? 'Desconocida',
    };
  }

  const skip = !ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::');
  if (skip) return { pais: 'Local', ciudad: 'Local' };
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2500),
    });
    const d = await res.json() as { country_name?: string; city?: string };
    return { pais: d.country_name ?? 'Desconocido', ciudad: d.city ?? 'Desconocida' };
  } catch {
    return { pais: 'Desconocido', ciudad: 'Desconocida' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = bestIp(req);
    const { pais, ciudad } = await geoLookup(ip, headerGeo(req));

    const db = await getMongoDb();
    await db.collection('analytics_events').insertOne({
      page:       body.page       ?? '/',
      demo:       body.demo       ?? null,
      event:      body.event      ?? 'pageview',
      seconds:    body.seconds    ?? null,
      referrer:   body.referrer   ?? null,
      ref:        body.ref        ?? null,
      ip,
      pais,
      ciudad,
      dispositivo: body.dispositivo ?? 'desktop',
      navegador:   body.navegador   ?? 'Desconocido',
      sessionId:   body.sessionId   ?? 'unknown',
      visitorId:   body.visitorId   ?? null,
      userAgent:   body.userAgent   ?? null,
      createdAt:   new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics/track]', err);
    return NextResponse.json({ ok: false });
  }
}
