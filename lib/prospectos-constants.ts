/** Valores permitidos para prospectos (CRM) — compartido API + dashboard */

export type ProspectoPipeline = 'Agentia' | 'Izzi';

export type ProspectoGiro =
  | 'Barbería'
  | 'Spa & Estética'
  | 'Grooming'
  | 'Clínica Dental'
  | 'Médico'
  | 'Restaurante'
  | 'Taller Mecánico'
  | 'Nutriólogo'
  | 'Inmobiliaria'
  | 'Telecomunicaciones'
  | 'Otro';

export type ProspectoCanalOrigen = 'WhatsApp' | 'Facebook' | 'Instagram' | 'Manual';

export const PIPELINE_DEFAULT: ProspectoPipeline = 'Agentia';

export const GIRO_OPTIONS: readonly ProspectoGiro[] = [
  'Barbería',
  'Spa & Estética',
  'Grooming',
  'Clínica Dental',
  'Médico',
  'Restaurante',
  'Taller Mecánico',
  'Nutriólogo',
  'Inmobiliaria',
  'Telecomunicaciones',
  'Otro',
] as const;

export const CANAL_ORIGEN_OPTIONS: readonly ProspectoCanalOrigen[] = [
  'WhatsApp',
  'Facebook',
  'Instagram',
  'Manual',
] as const;

const PIPELINE_SET = new Set<string>(['Agentia', 'Izzi']);
const CANAL_SET = new Set<string>([...CANAL_ORIGEN_OPTIONS]);

export function coercePipeline(raw: unknown): ProspectoPipeline {
  const s = String(raw ?? '').trim();
  if (PIPELINE_SET.has(s)) return s as ProspectoPipeline;
  return PIPELINE_DEFAULT;
}

export function coerceGiro(raw: unknown): ProspectoGiro {
  const s = String(raw ?? '').trim();
  if (GIRO_OPTIONS.includes(s as ProspectoGiro)) return s as ProspectoGiro;
  return 'Otro';
}

export function coerceCanalOrigen(raw: unknown): ProspectoCanalOrigen {
  const s = String(raw ?? '').trim();
  if (CANAL_SET.has(s)) return s as ProspectoCanalOrigen;
  return 'Manual';
}
