/** Precios de Agentia Lealtad (IVA incluido). La fuente de verdad es el servidor: nunca se confía en el total del navegador. */
export type Periodo = 'mensual' | 'anual';
export type MetodoPago = 'SPEI' | 'OXXO' | 'Mercado Pago';

export const PRECIO_BASE = { mensual: 399, anual: 3990 } as const;
export const PRECIO_SUCURSAL = { mensual: 150, anual: 1500 } as const;
export const COMISION_TARJETA = 0.05;
/** Oferta "Buen Mes": anual de la 1ª sucursal a este precio (cupo y vigencia en lealtad-promo.ts). */
export const PRECIO_PROMO_ANUAL = 1990;
/** Oferta "Buen Mes": primer mes a este precio (vigencia en lealtad-promo.ts). Después se cobra el normal. */
export const PRECIO_PROMO_MES = 199;
export type PromoTipo = 'anual' | 'mes' | null;

export function calcularTotal(periodo: Periodo, sucursales: number, pago: MetodoPago, promo: PromoTipo | boolean = null) {
  const tipo: PromoTipo = promo === true ? 'anual' : promo === false ? null : promo;
  const suc = Math.min(20, Math.max(1, Math.round(sucursales) || 1));
  const base =
    tipo === 'anual' && periodo === 'anual' ? PRECIO_PROMO_ANUAL
    : tipo === 'mes' && periodo === 'mensual' ? PRECIO_PROMO_MES
    : PRECIO_BASE[periodo];
  const subtotal = base + PRECIO_SUCURSAL[periodo] * (suc - 1);
  const comision = pago === 'Mercado Pago' ? Math.round(subtotal * COMISION_TARJETA) : 0;
  return { sucursales: suc, subtotal, comision, total: subtotal + comision };
}
