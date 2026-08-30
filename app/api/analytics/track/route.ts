import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { bestIp, lookupGeo, isAdminRequest } from '@/lib/analytics-helpers';

export const dynamic = 'force-dynamic';

function safeStr(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    // ── Skip tracking for admin (logged in via cookies) ─────────────────────
    if (isAdminRequest(req)) {
      return NextResponse.json({ ok: true, skipped: true, isAdmin: true });
    }

    const body = await req.json().catch(() => ({}));
    const ip = bestIp(req);
    const geo = await lookupGeo(req, ip);

    const db = await getMongoDb();
    await db.collection('analytics_events').insertOne({
      page:        body.page       ?? '/',
      demo:        body.demo       ?? null,
      event:       body.event      ?? 'pageview',
      seconds:     body.seconds    ?? null,
      referrer:    body.referrer   ?? null,
      ref:         body.ref        ?? null,
      ip,
      pais:        geo.pais,
      ciudad:      geo.ciudad,
      region:      geo.region ?? null,
      timezone:    safeStr(body.timezone, 50) ?? geo.timezone ?? null,
      isp:         geo.isp ?? null,
      idioma:      safeStr(body.idioma, 20),
      dispositivo: body.dispositivo ?? 'desktop',
      navegador:   body.navegador   ?? 'Desconocido',
      sessionId:   body.sessionId   ?? 'unknown',
      visitorId:   body.visitorId   ?? null,
      userAgent:   body.userAgent   ?? null,
      screenW:     typeof body.screenW === 'number' ? body.screenW : null,
      screenH:     typeof body.screenH === 'number' ? body.screenH : null,
      pixelRatio:  typeof body.pixelRatio === 'number' ? body.pixelRatio : null,
      createdAt:   new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[analytics/track]', err);
    return NextResponse.json({ ok: false });
  }
}
