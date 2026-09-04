import type { TenantConfig } from '@/lib/wallet-tenant';
import { comoAcumularCopy, tenantRecompensa, tenantRewardMeta } from '@/lib/wallet-tenant';

export const DEFAULT_REWARD_META = 10;

function formatQty(n: number, enteros: boolean): string {
  if (enteros) return String(Math.max(0, Math.round(n)));
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Mensaje de progreso para el loyaltyObject. Recalcular en cada sync. */
export function rewardProgressMessage(
  puntos: number,
  meta = DEFAULT_REWARD_META,
  unidad = 'para tu próxima recompensa',
  enteros = false,
): string {
  const m = Number.isFinite(meta) && meta > 0 ? meta : DEFAULT_REWARD_META;
  const p = Math.max(0, Number(puntos) || 0);
  const remainder = p % m;
  const faltan = remainder === 0 ? (p > 0 ? 0 : m) : m - remainder;
  if (faltan <= 0) return '¡Ya alcanzaste tu recompensa!';
  return `Te faltan ${formatQty(faltan, enteros)} ${unidad}`;
}

export type WalletTextModule = { id?: string; header: string; body: string };

export function buildLoyaltyObjectTextModules(
  cfg: TenantConfig,
  puntos: number,
): WalletTextModule[] {
  const rec = tenantRecompensa(cfg);
  const meta = tenantRewardMeta(cfg);
  const esSellos = rec.modelo === 'sellos';
  return [
    {
      id: 'progreso',
      header: 'Tu progreso',
      body: rewardProgressMessage(
        puntos,
        meta,
        esSellos ? 'sellos para tu recompensa' : 'para tu próxima recompensa',
        esSellos,
      ),
    },
    {
      header: 'Cómo acumular',
      body: comoAcumularCopy(cfg),
    },
    {
      header: 'Cómo usarlo',
      body: esSellos
        ? 'Muestra este código en la caja. Cada visita suma 1 sello.'
        : 'Muestra este código en la caja. Puedes usar tu saldo como pago en cualquier visita.',
    },
    ...(cfg.direccion ? [{ header: 'Dónde estamos', body: cfg.direccion }] : []),
    ...(cfg.horario ? [{ header: 'Horario', body: cfg.horario }] : []),
  ];
}
