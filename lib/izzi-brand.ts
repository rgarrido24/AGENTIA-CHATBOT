/** Logo oficial izzi (blanco) — Cloudinary */
export const IZZI_LOGO_URL =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1783708971/WhatsApp_Image_2026-07-10_at_12.39.23_PM_vludsc.jpg';

export const IZZI_MERIDA_WA =
  'https://wa.me/529844927769?text=Hola!%20Quiero%20contratar%20Internet%20Residencial%20100%20Mbps%20en%20M%C3%A9rida%20(%24120%2Fmes%20x%206%20meses).';

export const IZZI_PLAN = {
  name: 'Internet Residencial 100 Mbps',
  promoPrice: 120,
  promoMonths: 6,
  normalPrice: 480,
  speedMbps: 100,
} as const;

export const IZZI_MONTHLY_SAVINGS = IZZI_PLAN.normalPrice - IZZI_PLAN.promoPrice;
export const IZZI_TOTAL_SAVINGS = IZZI_MONTHLY_SAVINGS * IZZI_PLAN.promoMonths;
