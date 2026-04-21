import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

async function geoLookup(ip: string): Promise<{ pais: string; ciudad: string }> {
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
    const ip   = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { pais, ciudad } = await geoLookup(ip);

    const db = await getMongoDb();
    await db.collection('analytics_events').insertOne({
      page:       body.page       ?? '/',
      demo:       body.demo       ?? null,
      event:      body.event      ?? 'pageview',
      seconds:    body.seconds    ?? null,
      referrer:   body.referrer   ?? null,
      ip,
      pais,
      ciudad,
      dispositivo: body.dispositivo ?? 'desktop',
      navegador:   body.navegador   ?? 'Desconocido',
      sessionId:   body.sessionId   ?? 'unknown',
      userAgent:   body.userAgent   ?? null,
      createdAt:   new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics/track]', err);
    return NextResponse.json({ ok: false });
  }
}
