/**
 * Suscripciones de Agentia Lealtad: prueba de 7 días, renovación y suspensión por vencimiento.
 * La vigencia vive en `loyalty_tenants.vigenteHasta`. Los tenants sin ese campo (SABUCAN, Carnitas, demos)
 * nunca se suspenden por fecha.
 */
export const TRIAL_DIAS = 7;
export const GRACIA_DIAS_PAGO = 2; // un cliente que ya pagó tiene 2 días de gracia tras vencer
const DIA = 24 * 3600 * 1000;

type Doc = { vigenteHasta?: Date | string; plan?: string; origen?: string };

/** ¿Venció la vigencia (incluida la gracia)? Sin vigenteHasta → nunca. */
export function vigenciaVencida(doc: Doc, ahora = Date.now()): boolean {
  if (!doc.vigenteHasta) return false;
  const fin = new Date(doc.vigenteHasta).getTime();
  const gracia = doc.plan === 'trial' ? 0 : GRACIA_DIAS_PAGO * DIA;
  return ahora > fin + gracia;
}

export function diasRestantes(doc: Doc, ahora = Date.now()): number | null {
  if (!doc.vigenteHasta) return null;
  return Math.ceil((new Date(doc.vigenteHasta).getTime() - ahora) / DIA);
}

/** Nueva vigencia al renovar: desde el vencimiento actual si sigue vigente, o desde hoy. */
export function extenderVigencia(actual: Date | string | undefined, periodo: 'mensual' | 'anual', ahora = new Date()): Date {
  const base = actual && new Date(actual) > ahora ? new Date(actual) : new Date(ahora);
  if (periodo === 'anual') base.setFullYear(base.getFullYear() + 1);
  else base.setMonth(base.getMonth() + 1);
  return base;
}
