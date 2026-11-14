/** Precios de Agentia Lealtad (IVA incluido). La fuente de verdad es el servidor: nunca se confía en el total del navegador. */
export type Periodo = 'mensual' | 'anual';
export type MetodoPago = 'SPEI' | 'OXXO' | 'Mercado Pago';

export const PRECIO_BASE = { mensual: 399, anual: 3990 } as const;
export const PRECIO_SUCURSAL = { mensual: 150, anual: 1500 } as const;
export const COMISION_TARJETA = 0.05;

export function calcularTotal(periodo: Periodo, sucursales: number, pago: MetodoPago) {
  const suc = Math.min(20, Math.max(1, Math.round(sucursales) || 1));
  const subtotal = PRECIO_BASE[periodo] + PRECIO_SUCURSAL[periodo] * (suc - 1);
  const comision = pago === 'Mercado Pago' ? Math.round(subtotal * COMISION_TARJETA) : 0;
  return { sucursales: suc, subtotal, comision, total: subtotal + comision };
}
