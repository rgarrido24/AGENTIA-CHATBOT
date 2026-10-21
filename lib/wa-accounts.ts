import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import { decryptFbToken, encryptFbToken } from '@/lib/fb-token-crypto';
import { FB_GRAPH_VERSION, getFbAppId } from '@/lib/facebook-lead-connect';
import { contactKey, touchConversation } from '@/lib/wa-inbox';

/**
 * Cuentas de WhatsApp Business (API oficial) conectadas por cliente vía Embedded Signup.
 * Colección `wa_accounts`. El token de negocio se guarda cifrado (mismo esquema que Facebook).
 */
export const WA_ACCOUNTS = 'wa_accounts';
export const WA_MESSAGES = 'wa_messages';

export type WaAccountDoc = {
  resellerId: string;
  clientSlug: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhone?: string;
  verifiedName?: string;
  qualityRating?: string;
  /** Token de negocio cifrado. Nunca enviarlo al navegador. */
  tokenEnc: string;
  /** PIN de registro de dos pasos cifrado (se necesita para re-registrar el número). */
  pinEnc?: string;
  registered: boolean;
  subscribed: boolean;
  status: 'connected' | 'error';
  lastError?: string;
  connectedAt: Date;
  updatedAt: Date;
};

export type WaAccountPublic = Pick<
  WaAccountDoc,
  'wabaId' | 'phoneNumberId' | 'displayPhone' | 'verifiedName' | 'qualityRating' | 'registered' | 'subscribed' | 'status' | 'lastError' | 'connectedAt'
>;

export function toPublicWaAccount(doc: WaAccountDoc | null): WaAccountPublic | null {
  if (!doc) return null;
  return {
    wabaId: doc.wabaId,
    phoneNumberId: doc.phoneNumberId,
    displayPhone: doc.displayPhone,
    verifiedName: doc.verifiedName,
    qualityRating: doc.qualityRating,
    registered: doc.registered,
    subscribed: doc.subscribed,
    status: doc.status,
    lastError: doc.lastError,
    connectedAt: doc.connectedAt,
  };
}

export function getWaEmbeddedSignupConfigId(): string {
  return (process.env.WA_EMBEDDED_SIGNUP_CONFIG_ID || '').trim();
}

export async function getWaAccountByClient(resellerId: string, clientSlug: string): Promise<WaAccountDoc | null> {
  const db = await getMongoDb();
  return db.collection<WaAccountDoc>(WA_ACCOUNTS).findOne({ resellerId, clientSlug });
}

export async function getWaAccountByPhoneNumberId(phoneNumberId: string): Promise<WaAccountDoc | null> {
  if (!phoneNumberId) return null;
  const db = await getMongoDb();
  return db.collection<WaAccountDoc>(WA_ACCOUNTS).findOne({ phoneNumberId });
}

export function decryptWaToken(acc: Pick<WaAccountDoc, 'tokenEnc'>): string {
  return decryptFbToken(acc.tokenEnc);
}

type GraphJson = { error?: { message?: string; code?: number }; [k: string]: unknown };

async function graph(path: string, token: string, init?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> }): Promise<GraphJson> {
  const res = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as GraphJson;
  if (!res.ok && !json.error) json.error = { message: `HTTP ${res.status}` };
  return json;
}

async function exchangeSignupCode(code: string): Promise<string> {
  const appId = getFbAppId();
  const secret = (process.env.FB_APP_SECRET || '').trim();
  if (!appId || !secret) throw new Error('Falta FB_APP_ID o FB_APP_SECRET');
  const url = new URL(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', secret);
  url.searchParams.set('code', code);
  const res = await fetch(url);
  const json = (await res.json().catch(() => ({}))) as { access_token?: string } & GraphJson;
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || 'Meta no devolvió token para el código de Embedded Signup');
  }
  return json.access_token;
}

/**
 * Cierra el flujo de Embedded Signup: canjea el código, lee el número, suscribe la app a la
 * WABA del cliente y registra el número en Cloud API. Guarda todo en `wa_accounts`.
 * Cada paso que falle queda registrado en lastError sin perder lo ya conectado.
 */
export async function completeWhatsAppEmbeddedSignup(opts: {
  resellerId: string;
  clientSlug: string;
  code: string;
  wabaId: string;
  phoneNumberId: string;
}): Promise<WaAccountDoc> {
  const token = await exchangeSignupCode(opts.code);
  const errors: string[] = [];

  const info = await graph(`${opts.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`, token);
  if (info.error) errors.push(`número: ${info.error.message}`);

  const sub = await graph(`${opts.wabaId}/subscribed_apps`, token, { method: 'POST', body: {} });
  const subscribed = !sub.error;
  if (sub.error) errors.push(`suscripción: ${sub.error.message}`);

  const pin = String(crypto.randomInt(100000, 1000000));
  const reg = await graph(`${opts.phoneNumberId}/register`, token, {
    method: 'POST',
    body: { messaging_product: 'whatsapp', pin },
  });
  // Si el número ya estaba registrado Meta responde error; no lo tratamos como fallo de conexión.
  const registered = !reg.error || /already|ya (est|fue)/i.test(String(reg.error?.message ?? ''));
  if (!registered) errors.push(`registro: ${reg.error?.message}`);

  const now = new Date();
  const doc: WaAccountDoc = {
    resellerId: opts.resellerId,
    clientSlug: opts.clientSlug,
    wabaId: opts.wabaId,
    phoneNumberId: opts.phoneNumberId,
    displayPhone: typeof info.display_phone_number === 'string' ? info.display_phone_number : undefined,
    verifiedName: typeof info.verified_name === 'string' ? info.verified_name : undefined,
    qualityRating: typeof info.quality_rating === 'string' ? info.quality_rating : undefined,
    tokenEnc: encryptFbToken(token),
    pinEnc: encryptFbToken(pin),
    registered,
    subscribed,
    status: subscribed && registered ? 'connected' : 'error',
    lastError: errors.length ? errors.join(' | ').slice(0, 500) : undefined,
    connectedAt: now,
    updatedAt: now,
  };

  const db = await getMongoDb();
  await db.collection<WaAccountDoc>(WA_ACCOUNTS).updateOne(
    { resellerId: opts.resellerId, clientSlug: opts.clientSlug },
    { $set: doc },
    { upsert: true },
  );
  await db.collection(WA_ACCOUNTS).createIndex({ phoneNumberId: 1 }, { unique: true }).catch(() => undefined);
  return doc;
}

/**
 * Conexión manual (plan B sin Embedded Signup): se pegan el WABA ID, el ID del número y un token
 * de usuario del sistema generado PARA ESTA APP con permisos de WhatsApp. Valida el token contra
 * el número y suscribe la app a la cuenta para recibir mensajes y estados.
 */
export async function completeWhatsAppManualConnection(opts: {
  resellerId: string;
  clientSlug: string;
  wabaId: string;
  phoneNumberId: string;
  token: string;
}): Promise<WaAccountDoc> {
  const info = await graph(`${opts.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`, opts.token);
  if (info.error) {
    throw new Error(`El token no puede leer ese número: ${info.error.message}. Revisa que el ID del número sea correcto y que el token tenga acceso a esa cuenta.`);
  }
  const errors: string[] = [];
  const sub = await graph(`${opts.wabaId}/subscribed_apps`, opts.token, { method: 'POST', body: {} });
  const subscribed = !sub.error;
  if (sub.error) errors.push(`suscripción: ${sub.error.message}`);

  const now = new Date();
  const doc: WaAccountDoc = {
    resellerId: opts.resellerId,
    clientSlug: opts.clientSlug,
    wabaId: opts.wabaId,
    phoneNumberId: opts.phoneNumberId,
    displayPhone: typeof info.display_phone_number === 'string' ? info.display_phone_number : undefined,
    verifiedName: typeof info.verified_name === 'string' ? info.verified_name : undefined,
    qualityRating: typeof info.quality_rating === 'string' ? info.quality_rating : undefined,
    tokenEnc: encryptFbToken(opts.token),
    // El número ya está dado de alta en la nube por quien lo creó en Meta; no se vuelve a registrar.
    registered: true,
    subscribed,
    status: subscribed ? 'connected' : 'error',
    lastError: errors.length ? errors.join(' | ').slice(0, 500) : undefined,
    connectedAt: now,
    updatedAt: now,
  };
  const db = await getMongoDb();
  await db.collection<WaAccountDoc>(WA_ACCOUNTS).updateOne({ resellerId: opts.resellerId, clientSlug: opts.clientSlug }, { $set: doc }, { upsert: true });
  await db.collection(WA_ACCOUNTS).createIndex({ phoneNumberId: 1 }, { unique: true }).catch(() => undefined);
  return doc;
}

// ─── Registro de mensajes (entrantes y estados) ─────────────────────────────

export type WaMessageDoc = {
  resellerId: string;
  clientSlug: string;
  phoneNumberId: string;
  direction: 'in' | 'out';
  /** wamid de Meta */
  wamid: string;
  contact: string;
  /** Llave unificada de la persona (ver contactKey en wa-inbox). */
  contactKey?: string;
  text?: string;
  type?: string;
  campaignId?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  errorCode?: number;
  /** Categoría de cobro que reporta Meta en el estado (marketing, utility, service, authentication…). */
  pricingCategory?: string;
  billable?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Guarda un mensaje entrante de una cuenta conectada. Idempotente por wamid. Devuelve true si es nuevo. */
export async function recordWaInbound(
  acc: WaAccountDoc,
  msg: { id: string; from: string; type?: string; text?: string; name?: string },
): Promise<boolean> {
  const db = await getMongoDb();
  const now = new Date();
  const key = contactKey(msg.from);
  const shown = msg.text ?? (msg.type ? `[${msg.type}]` : '');
  const res = await db.collection<WaMessageDoc>(WA_MESSAGES).updateOne(
    { wamid: msg.id },
    {
      $setOnInsert: {
        resellerId: acc.resellerId,
        clientSlug: acc.clientSlug,
        phoneNumberId: acc.phoneNumberId,
        direction: 'in',
        wamid: msg.id,
        contact: msg.from,
        contactKey: key,
        type: msg.type,
        text: shown,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true },
  );
  if (res.upsertedCount === 0) return false;
  await touchConversation({
    resellerId: acc.resellerId,
    clientSlug: acc.clientSlug,
    contact: msg.from,
    direction: 'in',
    text: shown,
    name: msg.name,
    wamid: msg.id,
    at: now,
  });
  return true;
}

/** Actualiza el estado de entrega de un mensaje saliente por wamid (no falla si no existe). */
export async function recordWaStatus(status: {
  id: string;
  status: string;
  errorCode?: number;
  pricing?: { category?: string; billable?: boolean };
}): Promise<void> {
  const s = status.status.toLowerCase();
  if (s !== 'sent' && s !== 'delivered' && s !== 'read' && s !== 'failed') return;
  const db = await getMongoDb();
  await db.collection<WaMessageDoc>(WA_MESSAGES).updateOne(
    { wamid: status.id, direction: 'out' },
    {
      $set: {
        status: s,
        updatedAt: new Date(),
        ...(status.errorCode ? { errorCode: status.errorCode } : {}),
        ...(status.pricing?.category ? { pricingCategory: status.pricing.category } : {}),
        ...(typeof status.pricing?.billable === 'boolean' ? { billable: status.pricing.billable } : {}),
      },
    },
  );
}
