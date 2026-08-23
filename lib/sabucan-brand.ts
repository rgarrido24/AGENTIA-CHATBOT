/** Marca SABUCAN — colores y logo (mismo asset de la Loyalty Class de Wallet). */

export const SABUCAN_NAVY = '#1E2340';
export const SABUCAN_ORANGE = '#F2691F';

/**
 * Logo Cloudinary usado en la clase Google Wallet.
 * Override: NEXT_PUBLIC_SABUCAN_LOGO_URL
 */
export const SABUCAN_LOGO_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SABUCAN_LOGO_URL?.trim()) ||
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1787419176/WhatsApp_Image_2026-08-22_at_11.18.53_AM_vr2xah.jpg';

export function sabucanWaDigits(telefono: string): string {
  let digits = String(telefono ?? '').replace(/\D/g, '');
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.startsWith('52') && digits.length > 12) digits = digits.slice(-12);
  return digits;
}
