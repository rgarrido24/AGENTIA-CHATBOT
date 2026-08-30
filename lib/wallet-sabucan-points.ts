/** SABUCAN — puntos (seguro para client + server) */

/** 1 punto por cada $100 MXN gastados */
export const POINTS_RATE = 100;

/** Redondeo a 1 decimal (evita basura de float). */
export function roundPuntos(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

/** Formato UI: siempre 1 decimal (1 → "1.0", 1.5 → "1.5"). */
export function formatPuntos(n: number): string {
  return roundPuntos(n).toFixed(1);
}

/**
 * $100 = 1 pt, $150 = 1.5 pts, $250 = 2.5 pts — sin truncar.
 * Equivale a 1% de cashback (1 punto = $1 MXN).
 */
export function calcularPuntos(montoCompra: number): number {
  if (!Number.isFinite(montoCompra) || montoCompra <= 0) return 0;
  return roundPuntos(montoCompra / POINTS_RATE);
}

/** Cashback por defecto cuando el tenant no define uno. */
export const CASHBACK_PCT_DEFAULT = 1;

/**
 * Cashback en puntos (1 punto = $1 MXN): 5% de $200 = 10 pts.
 */
export function calcularPuntosCashback(montoCompra: number, cashbackPct: number): number {
  const monto = Number(montoCompra);
  const pct = Number(cashbackPct);
  if (!Number.isFinite(monto) || monto <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return roundPuntos(monto * (pct / 100));
}
