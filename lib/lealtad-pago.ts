/** Datos para pagos por transferencia SPEI directa (sin Mercado Pago). */
export const SPEI = {
  banco: process.env.SPEI_BANCO?.trim() || 'Klar',
  clabe: process.env.SPEI_CLABE?.trim() || '661180024415772828',
  beneficiario: process.env.SPEI_BENEFICIARIO?.trim() || 'Garrido Holdings S.A.S. de C.V.',
};

/** Concepto corto que el cliente pone en la transferencia para identificar su pago. */
export function conceptoSpei(ref: string): string {
  return `AG${ref.slice(-6).toUpperCase()}`;
}

export const WA_VENTAS = process.env.LEALTAD_WA_NUMBER?.trim() || '529844927769';
