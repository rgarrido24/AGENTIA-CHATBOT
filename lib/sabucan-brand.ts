/** @deprecated Prefer lib/wallet-tenant — reexport para compatibilidad SABUCAN. */
export {
  sabucanWaDigits,
  TENANTS,
} from '@/lib/wallet-tenant';

export const SABUCAN_NAVY = '#1E2340';
export const SABUCAN_ORANGE = '#F2691F';

export const SABUCAN_LOGO_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SABUCAN_LOGO_URL?.trim()) ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787419176/WhatsApp_Image_2026-08-22_at_11.18.53_AM_vr2xah.jpg';
