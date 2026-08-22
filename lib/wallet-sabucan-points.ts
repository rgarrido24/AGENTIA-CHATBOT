/** SABUCAN — puntos (seguro para client + server) */

/** 1 punto por cada $100 MXN gastados */
export const POINTS_RATE = 100;

export function calcularPuntos(montoCompra: number): number {
  if (!Number.isFinite(montoCompra) || montoCompra <= 0) return 0;
  return Math.floor(montoCompra / POINTS_RATE);
}
