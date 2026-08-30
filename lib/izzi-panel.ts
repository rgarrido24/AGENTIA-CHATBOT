export const IZZI_CLIENT_ID = 'izzi';
export const IZZI_PAGE_ID = 'whatsapp-bridge';

export type IzziConversationTipo = 'venta' | 'reclutamiento';

export type IzziVentaEtapa =
  | 'nuevo_contacto'
  | 'pregunton'
  | 'interesado'
  | 'cotizacion_enviada'
  | 'cerrado'
  | 'no_interesado';

export type IzziReclutamientoEtapa =
  | 'nuevo_contacto'
  | 'en_proceso'
  | 'entrevista_agendada'
  | 'contratado'
  | 'descartado';

export type IzziEtapa = IzziVentaEtapa | IzziReclutamientoEtapa;

export const IZZI_VENTA_ETAPAS: { id: IzziVentaEtapa; label: string; emoji: string }[] = [
  { id: 'nuevo_contacto', label: 'Nuevo contacto', emoji: '' },
  { id: 'pregunton', label: 'Preguntón', emoji: '' },
  { id: 'interesado', label: 'Interesado', emoji: '' },
  { id: 'cotizacion_enviada', label: 'Cotización enviada', emoji: '' },
  { id: 'cerrado', label: 'Cerrado', emoji: '✅' },
  { id: 'no_interesado', label: 'No interesado', emoji: '❌' },
];

export const IZZI_RECLUTAMIENTO_ETAPAS: { id: IzziReclutamientoEtapa; label: string; emoji: string }[] = [
  { id: 'nuevo_contacto', label: 'Nuevo contacto', emoji: '' },
  { id: 'en_proceso', label: 'En proceso', emoji: '' },
  { id: 'entrevista_agendada', label: 'Entrevista agendada', emoji: '' },
  { id: 'contratado', label: 'Contratado', emoji: '✅' },
  { id: 'descartado', label: 'Descartado', emoji: '❌' },
];

export const IZZI_TIPOS: { id: IzziConversationTipo; label: string; emoji: string }[] = [
  { id: 'venta', label: 'Venta', emoji: '🏠' },
  { id: 'reclutamiento', label: 'Reclutamiento', emoji: '👤' },
];

export const IZZI_DEFAULT_TIPO: IzziConversationTipo = 'venta';
export const IZZI_DEFAULT_ETAPA: IzziEtapa = 'nuevo_contacto';

export function isIzziTipo(raw: unknown): raw is IzziConversationTipo {
  return raw === 'venta' || raw === 'reclutamiento';
}

export function etapasForTipo(tipo: IzziConversationTipo) {
  return tipo === 'reclutamiento' ? IZZI_RECLUTAMIENTO_ETAPAS : IZZI_VENTA_ETAPAS;
}

export function isEtapaForTipo(tipo: IzziConversationTipo, etapa: string): boolean {
  return etapasForTipo(tipo).some((e) => e.id === etapa);
}

export function normalizeIzziTipo(raw: unknown): IzziConversationTipo {
  return isIzziTipo(raw) ? raw : IZZI_DEFAULT_TIPO;
}

export function normalizeIzziEtapa(tipo: IzziConversationTipo, raw: unknown): string {
  const etapa = typeof raw === 'string' ? raw.trim() : '';
  if (etapa && isEtapaForTipo(tipo, etapa)) return etapa;
  return IZZI_DEFAULT_ETAPA;
}

export function tipoLabel(tipo: IzziConversationTipo): string {
  const found = IZZI_TIPOS.find((t) => t.id === tipo);
  return found ? `${found.emoji} ${found.label}` : tipo;
}

export function etapaLabel(tipo: IzziConversationTipo, etapa: string): string {
  const found = etapasForTipo(tipo).find((e) => e.id === etapa);
  if (!found) return etapa;
  return found.emoji ? `${found.emoji} ${found.label}` : found.label;
}

export function phoneFromSenderId(senderId: string): string {
  const digits = String(senderId || '').replace(/\D/g, '');
  return digits || senderId;
}
