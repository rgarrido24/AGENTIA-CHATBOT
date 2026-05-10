import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { bestIp, lookupGeo, isAdminRequest } from '@/lib/analytics-helpers';

export const dynamic = 'force-dynamic';

function isUuidLike(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 16 && v.length <= 64;
}

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
      return NextResponse.json({ skipped: true, isAdmin: true });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const visitorId = isUuidLike(body.visitorId) ? String(body.visitorId) : '';
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId faltante' }, { status: 400 });
    }

    const page = typeof body.page === 'string' ? body.page : '/';
    const ref = safeStr(body.ref, 120);
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : 'unknown';
    const dispositivo = typeof body.dispositivo === 'string' ? body.dispositivo : 'desktop';
    const navegador = typeof body.navegador === 'string' ? body.navegador : 'Desconocido';
    const userAgent = safeStr(body.userAgent, 500);
    const idioma = safeStr(body.idioma, 20);
    const tzCliente = safeStr(body.timezone, 50);
    const screenW = typeof body.screenW === 'number' ? body.screenW : null;
    const screenH = typeof body.screenH === 'number' ? body.screenH : null;
    const pixelRatio = typeof body.pixelRatio === 'number' ? body.pixelRatio : null;

    const ip = bestIp(req);
    const geo = await lookupGeo(req, ip);

    const db = await getMongoDb();
    const col = db.collection('analytics_visitors');

    const now = new Date();
    const existing = await col.findOne(
      { visitorId },
      { projection: { _id: 0, visits: 1, lastSeenAt: 1, firstSeenAt: 1, firstRef: 1 } },
    );

    const lastSeenAt = (existing?.lastSeenAt instanceof Date ? existing.lastSeenAt : null) as Date | null;
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const shouldIncrement = !existing || (lastSeenAt ? lastSeenAt < thirtyMinAgo : true);

    const update: Record<string, unknown> = {
      $set: {
        lastSeenAt: now,
        lastPage: page,
        lastSessionId: sessionId,
        lastIp: ip,
        lastPais: geo.pais,
        lastCiudad: geo.ciudad,
        lastRegion: geo.region ?? null,
        lastTimezone: tzCliente ?? geo.timezone ?? null,
        lastIsp: geo.isp ?? null,
        lastIdioma: idioma,
        lastDispositivo: dispositivo,
        lastNavegador: navegador,
        lastUserAgent: userAgent,
        lastScreenW: screenW,
        lastScreenH: screenH,
        lastPixelRatio: pixelRatio,
        ...(ref ? { lastRef: ref } : {}),
      },
      $setOnInsert: {
        visitorId,
        firstSeenAt: now,
        firstPage: page,
        firstSessionId: sessionId,
        firstIp: ip,
        firstPais: geo.pais,
        firstCiudad: geo.ciudad,
        firstRegion: geo.region ?? null,
        firstTimezone: tzCliente ?? geo.timezone ?? null,
        firstIsp: geo.isp ?? null,
        firstIdioma: idioma,
        firstDispositivo: dispositivo,
        firstNavegador: navegador,
        firstUserAgent: userAgent,
        firstScreenW: screenW,
        firstScreenH: screenH,
        firstPixelRatio: pixelRatio,
        ...(ref ? { firstRef: ref } : {}),
        visits: 0,
      },
    };
    if (shouldIncrement) {
      (update.$inc as Record<string, number> | undefined) ??= {};
      (update.$inc as Record<string, number>).visits = 1;
    }

    const result = await col.findOneAndUpdate(
      { visitorId },
      update,
      { upsert: true, returnDocument: 'after' },
    );
    const doc = (result?.value ?? null) as { visits?: number } | null;
    const visits = typeof doc?.visits === 'number' ? doc.visits : (existing?.visits ?? 1);

    return NextResponse.json({
      visitorId,
      isNew: !existing,
      visits,
      ref,
      pais: geo.pais,
      ciudad: geo.ciudad,
    });
  } catch (err) {
    console.error('[analytics/visit]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
