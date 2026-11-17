/**
 * Tenant de lealtad de Tostichelas (`loyalty_tenants`, key "tostichelas").
 * La lógica genérica vive en `lib/restaurantes/tenant.ts`. Solo servidor.
 */
import type { TenantConfig } from '@/lib/wallet-tenant';
import { actualizarCashback, ensureTenant } from '@/lib/restaurantes/tenant';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export const TOSTICHELAS_KEY = 'tostichelas';

export const ensureTostichelasTenant = (): Promise<TenantConfig | null> => ensureTenant(SERVIDOR.tostichelas);

export const pinDuenoTostichelas = () =>
  process.env.TOSTICHELAS_PIN_DUENO || process.env.TOSTICHELAS_DUENO_PIN || '2222';

/** Cambia el % de cashback del tenant (solo el dueño, ya validado por PIN). */
export const actualizarCashbackTostichelas = (pct: number): Promise<TenantConfig | null> =>
  actualizarCashback(SERVIDOR.tostichelas, pct);
