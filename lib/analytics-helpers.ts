import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from './mongodb';

// ─── IP detection ─────────────────────────────────────────────────────────────
export function bestIp(req: NextRequest): string {
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

// ─── Geo from platform headers (Cloudflare, Vercel, etc.) ─────────────────────
export type GeoData = {
  pais: string;
  ciudad: string;
  region?: string;
  isp?: string;
  timezone?: string;
};

function headerGeo(req: NextRequest): Partial<GeoData> {
  const country =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    undefined;
  const city =
    req.headers.get('x-vercel-ip-city') ||
    req.headers.get('cf-ipcity') ||
    undefined;
  const region =
    req.headers.get('x-vercel-ip-country-region') ||
    req.headers.get('cf-region') ||
    undefined;
  const tz =
    req.headers.get('x-vercel-ip-timezone') ||
    req.headers.get('cf-timezone') ||
    undefined;

  const out: Partial<GeoData> = {};
  if (country && country !== 'XX') out.pais = country;
  if (city) out.ciudad = decodeURIComponent(city);
  if (region) out.region = decodeURIComponent(region);
  if (tz) out.timezone = tz;
  return out;
}

// ─── Geo lookup with MongoDB cache + multiple providers ──────────────────────
const GEO_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
const GEO_FETCH_TIMEOUT_MS = 2500;

type CachedGeo = { ip: string; data: GeoData; cachedAt: Date };

async function readGeoCache(ip: string): Promise<GeoData | null> {
  try {
    const db = await getMongoDb();
    const doc = (await db
      .collection('geo_cache')
      .findOne({ ip }, { projection: { _id: 0, data: 1, cachedAt: 1 } })) as CachedGeo | null;
    if (!doc) return null;
    const age = Date.now() - new Date(doc.cachedAt).getTime();
    if (age > GEO_CACHE_TTL_MS) return null;
    return doc.data;
  } catch {
    return null;
  }
}

async function writeGeoCache(ip: string, data: GeoData): Promise<void> {
  try {
    const db = await getMongoDb();
    await db
      .collection('geo_cache')
      .updateOne({ ip }, { $set: { ip, data, cachedAt: new Date() } }, { upsert: true });
  } catch {
    /* ignore cache write errors */
  }
}

async function fetchIpwhois(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(`https://ipwho.is/${ip}?fields=success,country,city,region,connection,timezone`, {
      signal: AbortSignal.timeout(GEO_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      success?: boolean;
      country?: string;
      city?: string;
      region?: string;
      connection?: { isp?: string };
      timezone?: { id?: string };
    };
    if (!d?.success) return null;
    if (!d.country && !d.city) return null;
    return {
      pais: d.country ?? 'Desconocido',
      ciudad: d.city ?? 'Desconocida',
      region: d.region ?? undefined,
      isp: d.connection?.isp ?? undefined,
      timezone: d.timezone?.id ?? undefined,
    };
  } catch {
    return null;
  }
}

async function fetchIpapiCo(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(GEO_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      country_name?: string;
      city?: string;
      region?: string;
      org?: string;
      timezone?: string;
      error?: boolean;
    };
    if (d?.error) return null;
    if (!d.country_name && !d.city) return null;
    return {
      pais: d.country_name ?? 'Desconocido',
      ciudad: d.city ?? 'Desconocida',
      region: d.region ?? undefined,
      isp: d.org ?? undefined,
      timezone: d.timezone ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function lookupGeo(req: NextRequest, ip: string): Promise<GeoData> {
  // 1) Headers from platform (best, fastest, free)
  const fromHeaders = headerGeo(req);
  if (fromHeaders.pais && fromHeaders.ciudad) {
    return {
      pais: fromHeaders.pais,
      ciudad: fromHeaders.ciudad,
      region: fromHeaders.region,
      timezone: fromHeaders.timezone,
    };
  }

  // 2) Skip lookup for local/invalid IPs
  const skip = !ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::') || ip.startsWith('192.168.') || ip.startsWith('10.');
  if (skip) {
    return {
      pais: fromHeaders.pais ?? 'Local',
      ciudad: fromHeaders.ciudad ?? 'Local',
      region: fromHeaders.region,
      timezone: fromHeaders.timezone,
    };
  }

  // 3) Check MongoDB cache (avoid hammering external APIs)
  const cached = await readGeoCache(ip);
  if (cached) {
    return {
      ...cached,
      pais: fromHeaders.pais ?? cached.pais,
      ciudad: fromHeaders.ciudad ?? cached.ciudad,
    };
  }

  // 4) Cascade through providers
  const result =
    (await fetchIpwhois(ip)) ??
    (await fetchIpapiCo(ip)) ??
    null;

  if (result) {
    await writeGeoCache(ip, result);
    return {
      pais: fromHeaders.pais ?? result.pais,
      ciudad: fromHeaders.ciudad ?? result.ciudad,
      region: fromHeaders.region ?? result.region,
      isp: result.isp,
      timezone: fromHeaders.timezone ?? result.timezone,
    };
  }

  return {
    pais: fromHeaders.pais ?? 'Desconocido',
    ciudad: fromHeaders.ciudad ?? 'Desconocida',
    region: fromHeaders.region,
    timezone: fromHeaders.timezone,
  };
}

// ─── Admin detection from cookies (server-side, reliable) ────────────────────
const ADMIN_COOKIE = 'admin_auth';
const DASHBOARD_COOKIE = 'dashboard_auth';
const ADMIN_SALT = 'agentia_admin_salt';
const DASHBOARD_SALT = 'agentia_dashboard_v2';

function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function isAdminRequest(req: NextRequest): boolean {
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return false;

  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  const expectedAdmin = sha256Hex(adminPass + ADMIN_SALT);
  if (adminToken && adminToken === expectedAdmin) return true;

  const adminUser = process.env.ADMIN_USER || 'admin';
  const dashToken = req.cookies.get(DASHBOARD_COOKIE)?.value;
  const expectedDash = sha256Hex(adminUser + ':' + adminPass + DASHBOARD_SALT);
  if (dashToken && dashToken === expectedDash) return true;

  return false;
}
