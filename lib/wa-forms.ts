import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';

/**
 * Formularios que terminan en WhatsApp (add-on `forms`).
 * wa_forms: definición. wa_form_responses: respuestas. El lead también se guarda en `leads`
 * del panel del cliente al enviar, antes de pasar a WhatsApp.
 */
export const WA_FORMS = 'wa_forms';
export const WA_FORM_RESPONSES = 'wa_form_responses';

export const FIELD_TYPES = ['name', 'phone', 'email', 'text', 'longtext', 'select', 'date'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  /** Solo para type=select */
  options?: string[];
};

export type WaFormDoc = {
  formId: string;
  publicSlug: string;
  resellerId: string;
  clientSlug: string;
  title: string;
  description?: string;
  fields: FormField[];
  submitText: string;
  thankYouText: string;
  /** Frase con la que empieza el mensaje de WhatsApp. */
  messageIntro: string;
  /** Número de WhatsApp del cliente al que pasa la persona (solo dígitos, con código de país). */
  whatsappNumber: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WaFormResponseDoc = {
  formId: string;
  resellerId: string;
  clientSlug: string;
  leadId: string;
  answers: Record<string, string>;
  createdAt: Date;
};

export const MAX_FIELDS = 20;

export function newFormId(): string {
  return crypto.randomBytes(6).toString('hex');
}

export function slugify(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'formulario'}-${crypto.randomBytes(2).toString('hex')}`;
}

export function normalizeDigits(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/** Valida y normaliza la definición que llega del constructor. Devuelve error legible o los campos limpios. */
export function sanitizeFormInput(
  b: Record<string, unknown>,
): { error: string } | { value: Pick<WaFormDoc, 'title' | 'description' | 'fields' | 'submitText' | 'thankYouText' | 'messageIntro' | 'whatsappNumber' | 'active'> } {
  const title = String(b.title ?? '').trim().slice(0, 120);
  if (!title) return { error: 'El formulario necesita un título' };

  const rawFields = Array.isArray(b.fields) ? b.fields : [];
  if (rawFields.length === 0 || rawFields.length > MAX_FIELDS) {
    return { error: `Agrega entre 1 y ${MAX_FIELDS} preguntas` };
  }
  const fields: FormField[] = [];
  const ids = new Set<string>();
  for (const raw of rawFields) {
    const f = (raw ?? {}) as Record<string, unknown>;
    const label = String(f.label ?? '').trim().slice(0, 120);
    const type = String(f.type ?? '') as FieldType;
    if (!label) return { error: 'Todas las preguntas necesitan un texto' };
    if (!(FIELD_TYPES as readonly string[]).includes(type)) return { error: `Tipo de pregunta inválido: ${type}` };
    let id = String(f.id ?? '').replace(/[^a-z0-9_]/gi, '').slice(0, 24);
    if (!id || ids.has(id)) id = `q${crypto.randomBytes(3).toString('hex')}`;
    ids.add(id);
    const field: FormField = { id, label, type, required: f.required === true };
    if (type === 'select') {
      const options = (Array.isArray(f.options) ? f.options : [])
        .map((o) => String(o ?? '').trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 20);
      if (options.length < 2) return { error: `La pregunta "${label}" necesita al menos 2 opciones` };
      field.options = options;
    }
    fields.push(field);
  }

  const whatsappNumber = normalizeDigits(String(b.whatsappNumber ?? ''));
  if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
    return { error: 'El número de WhatsApp debe incluir el código de país (10 a 15 dígitos)' };
  }

  return {
    value: {
      title,
      description: String(b.description ?? '').trim().slice(0, 500) || undefined,
      fields,
      submitText: String(b.submitText ?? '').trim().slice(0, 40) || 'Enviar',
      thankYouText: String(b.thankYouText ?? '').trim().slice(0, 300) || '¡Gracias! Ahora continúa por WhatsApp para terminar.',
      messageIntro: String(b.messageIntro ?? '').trim().slice(0, 200) || 'Hola, llené el formulario:',
      whatsappNumber,
      active: b.active !== false,
    },
  };
}

/** Valida las respuestas de una persona contra la definición. Devuelve respuestas limpias o error. */
export function validateAnswers(
  form: Pick<WaFormDoc, 'fields'>,
  raw: Record<string, unknown>,
): { error: string } | { answers: Record<string, string> } {
  const answers: Record<string, string> = {};
  for (const f of form.fields) {
    const v = String(raw[f.id] ?? '').trim().slice(0, 1000);
    if (!v) {
      if (f.required) return { error: `Falta responder: ${f.label}` };
      continue;
    }
    if (f.type === 'phone' && normalizeDigits(v).length < 8) return { error: `Teléfono inválido en: ${f.label}` };
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: `Correo inválido en: ${f.label}` };
    if (f.type === 'select' && !(f.options ?? []).includes(v)) return { error: `Opción inválida en: ${f.label}` };
    if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return { error: `Fecha inválida en: ${f.label}` };
    answers[f.id] = v;
  }
  return { answers };
}

export function buildWhatsAppMessage(form: Pick<WaFormDoc, 'fields' | 'messageIntro'>, answers: Record<string, string>): string {
  const lines = form.fields.filter((f) => answers[f.id]).map((f) => `• ${f.label}: ${answers[f.id]}`);
  return `${form.messageIntro}\n\n${lines.join('\n')}`;
}

export function buildWaMeUrl(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export async function ensureFormIndexes(): Promise<void> {
  const db = await getMongoDb();
  await db.collection(WA_FORMS).createIndex({ publicSlug: 1 }, { unique: true }).catch(() => undefined);
  await db.collection(WA_FORMS).createIndex({ resellerId: 1, clientSlug: 1 }).catch(() => undefined);
  await db.collection(WA_FORM_RESPONSES).createIndex({ formId: 1, createdAt: -1 }).catch(() => undefined);
}

export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
