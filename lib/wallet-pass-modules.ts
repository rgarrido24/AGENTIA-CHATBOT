import type { TenantConfig } from '@/lib/wallet-tenant';
import { tenantCashbackPct, tenantRewardMeta } from '@/lib/wallet-tenant';

export const DEFAULT_REWARD_META = 10;

function formatQty(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Mensaje de progreso para el loyaltyObject. Recalcular en cada sync. */
export function rewardProgressMessage(puntos: number, meta = DEFAULT_REWARD_META): string {
  const m = Number.isFinite(meta) && meta > 0 ? meta : DEFAULT_REWARD_META;
  const p = Math.max(0, Number(puntos) || 0);
  const remainder = p % m;
  const faltan = remainder === 0 ? (p > 0 ? 0 : m) : m - remainder;
  if (faltan <= 0) return '¡Ya alcanzaste tu recompensa!';
  return `Te faltan ${formatQty(faltan)} para tu próxima recompensa`;
}

export type WalletTextModule = { id?: string; header: string; body: string };

export function buildLoyaltyObjectTextModules(
  cfg: TenantConfig,
  puntos: number,
): WalletTextModule[] {
  const pct = tenantCashbackPct(cfg);
  const meta = tenantRewardMeta(cfg);
  return [
    {
      id: 'progreso',
      header: 'Tu progreso',
      body: rewardProgressMessage(puntos, meta),
    },
    {
      header: 'Cómo acumular',
      body:
        pct === 1
          ? `1 punto por cada $100 MXN · ${cfg.nombre}`
          : `${pct}% de cashback en puntos (1 punto = $1 MXN) · ${cfg.nombre}`,
    },
    {
      header: 'Cómo usarlo',
      body: 'Muestra este código en la caja. Puedes usar tu saldo como pago en cualquier visita.',
    },
    ...(cfg.direccion ? [{ header: 'Dónde estamos', body: cfg.direccion }] : []),
    ...(cfg.horario ? [{ header: 'Horario', body: cfg.horario }] : []),
  ];
}
