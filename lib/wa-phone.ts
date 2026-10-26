// Utilidades puras de teléfonos de WhatsApp (se usan en el servidor y en el navegador).

/**
 * Deja el teléfono como lo pide WhatsApp: solo dígitos con código de país.
 * Con defaultCc '54' (cuenta argentina) también arregla los formatos típicos de Argentina:
 * sin el 9 (54 351…), con 0 y 15 (0351 15 701…) o sin código de país. Siempre queda 549 + 10 dígitos.
 */
export function normalizeWaPhone(raw: string, defaultCc?: string): string {
  const d = String(raw ?? '').replace(/\D/g, '').replace(/^0+/, '');
  return defaultCc === '54' ? normalizeArgentina(d) : d;
}

function normalizeArgentina(d: string): string {
  // Números de otros países (México +52, EE. UU. +1…) se dejan tal cual.
  if (d.startsWith('52') && d.length >= 12) return d;
  let rest: string;
  if (d.startsWith('54')) rest = d.slice(2);
  else if (d.length <= 12 && !(d.length === 11 && d.startsWith('1'))) rest = d;
  else return d;
  rest = rest.replace(/^0+/, '');
  if (rest.length === 11 && rest.startsWith('9')) rest = rest.slice(1);
  if (rest.length === 12) {
    // Formato local con 15: código de área (2 a 4 dígitos) + 15 + número.
    for (const a of [2, 3, 4]) {
      if (rest.slice(a, a + 2) === '15') {
        rest = rest.slice(0, a) + rest.slice(a + 2);
        break;
      }
    }
  }
  return rest.length === 10 ? `549${rest}` : d;
}

/** País por defecto de una cuenta conectada, según el prefijo de su número ('54' Argentina, '52' México). */
export function accountCountryCode(acc: { displayPhone?: string }): string | undefined {
  const d = String(acc.displayPhone ?? '').replace(/\D/g, '');
  return d.startsWith('54') ? '54' : d.startsWith('52') ? '52' : undefined;
}
