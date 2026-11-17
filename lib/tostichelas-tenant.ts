/**
 * Tenant de lealtad de la demo de Tostichelas (`loyalty_tenants`, key "tostichelas").
 * Usa el mismo motor que Carnitas Granada y Sabucan: mismas colecciones, mismo
 * cálculo de saldo y mismo pase de Google Wallet. Se crea solo la primera vez.
 *
 * Solo servidor.
 */
import { getMongoDb } from '@/lib/mongodb';
import {
  getLoyaltyTenant,
  invalidateLoyaltyTenantCache,
  loyaltyDocToConfig,
} from '@/lib/loyalty-tenants';
import { asegurarClaseWallet } from '@/lib/wallet-class-admin';
import type { TenantConfig } from '@/lib/wallet-tenant';

export const TOSTICHELAS_KEY = 'tostichelas';

function publicBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentia.software').replace(/\/$/, '');
}

export async function ensureTostichelasTenant(): Promise<TenantConfig | null> {
  const db = await getMongoDb();
  const col = db.collection('loyalty_tenants');
  let doc = await col.findOne({ key: TOSTICHELAS_KEY });

  if (!doc) {
    const nuevo = {
      key: TOSTICHELAS_KEY,
      nombre: 'Tostichelas',
      logoUrl: `${publicBase()}/tostichelas/logo.jpg`,
      colorPrimario: '#E2573A',
      colorAcento: '#F2C14E',
      plan: 'demo',
      isDemo: true,
      panelActivo: true,
      origen: 'demo-restaurante',
      collection: `demo_${TOSTICHELAS_KEY}_clientes`,
      classSuffix: `demo_${TOSTICHELAS_KEY}_lealtad`,
      objectPrefix: `demo-${TOSTICHELAS_KEY}`,
      basePath: `/demo/${TOSTICHELAS_KEY}`,
      recompensa: { modelo: 'cashback', parametro: 5 },
      rewardMeta: 10,
      giro: 'restaurante',
      createdAt: new Date(),
    };
    try {
      await col.insertOne(nuevo);
    } catch (e) {
      // Dos peticiones a la vez: la otra ya lo creó.
      console.warn('[tostichelas-tenant] insert', e instanceof Error ? e.message : e);
    }
    invalidateLoyaltyTenantCache(TOSTICHELAS_KEY);
    doc = await col.findOne({ key: TOSTICHELAS_KEY });
  }

  if (doc && !doc.walletClase) {
    try {
      const r = await asegurarClaseWallet(loyaltyDocToConfig(doc as Record<string, unknown>));
      if (r.ok) await col.updateOne({ key: TOSTICHELAS_KEY }, { $set: { walletClase: true } });
      else console.warn('[tostichelas-tenant] wallet:', r.detalle);
    } catch (e) {
      console.warn('[tostichelas-tenant] wallet', e instanceof Error ? e.message : e);
    }
  }

  return getLoyaltyTenant(TOSTICHELAS_KEY);
}

export const pinDuenoTostichelas = () =>
  process.env.TOSTICHELAS_PIN_DUENO || process.env.TOSTICHELAS_DUENO_PIN || '2222';

/** Cambia el % de cashback del tenant (solo el dueño, ya validado por PIN). */
export async function actualizarCashbackTostichelas(pct: number): Promise<TenantConfig | null> {
  const db = await getMongoDb();
  const valor = Math.min(30, Math.max(0.5, Math.round(pct * 100) / 100));
  await db
    .collection('loyalty_tenants')
    .updateOne({ key: TOSTICHELAS_KEY }, { $set: { 'recompensa.modelo': 'cashback', 'recompensa.parametro': valor } });
  invalidateLoyaltyTenantCache(TOSTICHELAS_KEY);
  return getLoyaltyTenant(TOSTICHELAS_KEY);
}
