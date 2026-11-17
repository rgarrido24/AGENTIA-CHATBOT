/**
 * Tenant de lealtad de un restaurante (`loyalty_tenants`, key = slug). Usa el mismo motor que
 * Carnitas Granada y Sabucan: mismas colecciones, mismo cálculo de saldo, mismo pase de Google
 * Wallet. Se crea solo la primera vez. Solo servidor.
 */
import { getMongoDb } from '@/lib/mongodb';
import { getLoyaltyTenant, invalidateLoyaltyTenantCache, loyaltyDocToConfig } from '@/lib/loyalty-tenants';
import { asegurarClaseWallet } from '@/lib/wallet-class-admin';
import type { TenantConfig } from '@/lib/wallet-tenant';
import type { ServidorConfig } from './servidor';

function publicBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentia.software').replace(/\/$/, '');
}

export async function ensureTenant(cfg: ServidorConfig): Promise<TenantConfig | null> {
  const key = cfg.tenant.key;
  const db = await getMongoDb();
  const col = db.collection('loyalty_tenants');
  let doc = await col.findOne({ key });

  if (!doc) {
    const t = cfg.tenant;
    const nuevo: Record<string, unknown> = {
      key,
      nombre: t.nombre,
      logoUrl: `${publicBase()}${t.logo}`,
      colorPrimario: t.colorPrimario,
      colorAcento: t.colorAcento,
      plan: t.plan,
      isDemo: t.isDemo,
      panelActivo: true,
      origen: t.origen,
      collection: t.isDemo ? `demo_${key}_clientes` : `${key}_clientes`,
      classSuffix: t.isDemo ? `demo_${key}_lealtad` : `${key}_lealtad`,
      objectPrefix: t.isDemo ? `demo-${key}` : key,
      basePath: `/${key}`,
      recompensa: t.recompensa,
      rewardMeta: t.rewardMeta,
      giro: t.giro,
      createdAt: new Date(),
    };
    if (t.whatsapp) nuevo.whatsapp = t.whatsapp;
    try {
      await col.insertOne(nuevo);
    } catch (e) {
      // Dos peticiones a la vez: la otra ya lo creó.
      console.warn(`[restaurante:${key}] insert tenant`, e instanceof Error ? e.message : e);
    }
    invalidateLoyaltyTenantCache(key);
    doc = await col.findOne({ key });
  }

  if (doc && doc.basePath !== `/${key}`) {
    await col.updateOne({ key }, { $set: { basePath: `/${key}` } });
    invalidateLoyaltyTenantCache(key);
  }

  if (doc && !doc.walletClase) {
    try {
      const r = await asegurarClaseWallet(loyaltyDocToConfig(doc as Record<string, unknown>));
      if (r.ok) await col.updateOne({ key }, { $set: { walletClase: true } });
      else console.warn(`[restaurante:${key}] wallet:`, r.detalle);
    } catch (e) {
      console.warn(`[restaurante:${key}] wallet`, e instanceof Error ? e.message : e);
    }
  }

  return getLoyaltyTenant(key);
}

/** Cambia el % de cashback del tenant (solo el dueño, ya validado por PIN). */
export async function actualizarCashback(cfg: ServidorConfig, pct: number): Promise<TenantConfig | null> {
  const key = cfg.tenant.key;
  const db = await getMongoDb();
  const valor = Math.min(30, Math.max(0.5, Math.round(pct * 100) / 100));
  await db
    .collection('loyalty_tenants')
    .updateOne({ key }, { $set: { 'recompensa.modelo': 'cashback', 'recompensa.parametro': valor } });
  invalidateLoyaltyTenantCache(key);
  return getLoyaltyTenant(key);
}
