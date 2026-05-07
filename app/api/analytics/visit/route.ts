import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

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
    const d = (await res.json()) as { country_name?: string; city?: string };
    return { pais: d.country_name ?? 'Desconocido', ciudad: d.city ?? 'Desconocida' };
  } catch {
    return { pais: 'Desconocido', ciudad: 'Desconocida' };
  }
}

function isUuidLike(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 16 && v.length <= 64;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const visitorId = isUuidLike(body.visitorId) ? String(body.visitorId) : '';
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId faltante' }, { status: 400 });
    }

    const page = typeof body.page === 'string' ? body.page : '/';
    const ref = typeof body.ref === 'string' && body.ref.trim() ? body.ref.trim() : null;
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : 'unknown';
    const dispositivo = typeof body.dispositivo === 'string' ? body.dispositivo : 'desktop';
    const navegador = typeof body.navegador === 'string' ? body.navegador : 'Desconocido';
    const userAgent = typeof body.userAgent === 'string' ? body.userAgent : null;

    const ip = bestIp(req);
    const { pais, ciudad } = await geoLookup(ip, headerGeo(req));

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
        lastPais: pais,
        lastCiudad: ciudad,
        lastDispositivo: dispositivo,
        lastNavegador: navegador,
        lastUserAgent: userAgent,
        ...(ref ? { lastRef: ref } : {}),
      },
      $setOnInsert: {
        visitorId,
        firstSeenAt: now,
        firstPage: page,
        firstSessionId: sessionId,
        firstIp: ip,
        firstPais: pais,
        firstCiudad: ciudad,
        firstDispositivo: dispositivo,
        firstNavegador: navegador,
        firstUserAgent: userAgent,
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
      pais,
      ciudad,
    });
  } catch (err) {
    console.error('[analytics/visit]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

