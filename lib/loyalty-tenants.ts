/**
 * Tenants de lealtad en Mongo (`loyalty_tenants`).
 * Fuente de verdad operativa: un negocio nuevo no requiere deploy
 * para aparecer en /demo/[negocio] ni en las APIs de lealtad.
 *
 * Solo servidor — no importar desde componentes cliente.
 */
import { getMongoDb } from '@/lib/mongodb';
import { getTenant, type TenantConfig } from '@/lib/wallet-tenant';

export const LOYALTY_TENANTS_COLLECTION = 'loyalty_tenants';

const TTL_MS = 15_000;
const cache = new Map<string, { at: number; value: TenantConfig | null }>();

type Recompensa = { modelo?: string; parametro?: number };

function hex(raw: unknown, fallback: string): string {
  const s = String(raw ?? '').trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(s)) {
    return s.startsWith('#') ? `#${s.slice(1).toUpperCase()}` : `#${s.toUpperCase()}`;
  }
  return fallback;
}

function aliasKey(raw: string): string {
  const key = String(raw ?? '').trim();
  if (key === 'carnitas') return 'carnitas_granada';
  return key;
}

export function loyaltyDocToConfig(doc: Record<string, unknown>): TenantConfig {
  const key = String(doc.key ?? '').trim();
  const isDemo = doc.isDemo === true || doc.plan === 'demo';
  const hyphen = key.replace(/_/g, '-');
  const rec = (doc.recompensa ?? {}) as Recompensa;
  const modelo =
    rec.modelo === 'sellos' || rec.modelo === 'puntos' || rec.modelo === 'cashback'
      ? rec.modelo
      : 'cashback';
  const parametro =
    Number(rec.parametro) > 0 ? Number(rec.parametro) : modelo === 'sellos' ? 10 : 1;
  const cashbackPct = modelo === 'cashback' ? parametro : 1;

  const ubicacionRaw = doc.ubicacion as { lat?: number; lng?: number } | undefined;
  const lat = Number(ubicacionRaw?.lat);
  const lng = Number(ubicacionRaw?.lng);

  return {
    id: key,
    nombre: String(doc.nombre || key),
    logoUrl: String(doc.logoUrl || ''),
    walletLogoUrl: doc.walletLogoUrl ? String(doc.walletLogoUrl) : undefined,
    colorPrimario: hex(doc.colorPrimario, '#1E2340'),
    colorAcento: hex(doc.colorAcento, '#F2691F'),
    classSuffix: String(
      doc.classSuffix || (isDemo ? `demo_${key}_lealtad` : `${key}_lealtad`),
    ),
    objectPrefix: String(doc.objectPrefix || (isDemo ? `demo-${hyphen}` : hyphen)),
    collection: String(
      doc.collection || (isDemo ? `demo_${key}_clientes` : `${key}_clientes`),
    ),
    basePath: String(doc.basePath || (isDemo ? `/demo/${key}` : `/${hyphen}`)),
    isDemo,
    cashbackPct,
    recompensa: { modelo, parametro },
    waNumber: doc.whatsapp ? String(doc.whatsapp) : undefined,
    mapsUrl: doc.mapsUrl ? String(doc.mapsUrl) : undefined,
    direccion: doc.direccion ? String(doc.direccion) : undefined,
    horario: doc.horario ? String(doc.horario) : undefined,
    ubicacion: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
    rewardMeta:
      modelo === 'sellos'
        ? parametro
        : Number(doc.rewardMeta) > 0
          ? Number(doc.rewardMeta)
          : 10,
  };
}

async function findDoc(raw: string): Promise<Record<string, unknown> | null> {
  const key = aliasKey(raw);
  const underscored = key.replace(/-/g, '_');
  const hyphen = key.replace(/_/g, '-');
  const db = await getMongoDb();
  const doc = await db.collection(LOYALTY_TENANTS_COLLECTION).findOne({
    $or: [
      { key },
      { key: raw },
      { key: underscored },
      { basePath: `/demo/${raw}` },
      { basePath: `/demo/${key}` },
      { basePath: `/demo/${underscored}` },
      { basePath: `/${hyphen}` },
      { basePath: `/${raw}` },
    ],
  });
  return doc as Record<string, unknown> | null;
}

/** Mongo primero; si no hay documento (o Mongo falla), cae al TENANTS hardcodeado. */
export async function getLoyaltyTenant(raw: string): Promise<TenantConfig | null> {
  const key = aliasKey(String(raw ?? '').trim());
  if (!key) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  let fromMongo: TenantConfig | null = null;
  try {
    const doc = await findDoc(key);
    if (doc?.key) fromMongo = loyaltyDocToConfig(doc);
  } catch (e) {
    console.warn('[loyalty-tenants]', e instanceof Error ? e.message : e);
  }

  const value = fromMongo ?? getTenant(key) ?? getTenant(String(raw ?? '').trim());
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function invalidateLoyaltyTenantCache(key?: string) {
  if (key) cache.delete(aliasKey(key));
  else cache.clear();
}
