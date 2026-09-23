import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import type { ResellerClient } from '@/lib/reseller-auth';
import { hashClientPassword } from '@/lib/client-auth';
import { decryptFbToken, encryptFbToken } from '@/lib/fb-token-crypto';
import {
  fbConnectUserMessage,
  type FbConnectErrorCode,
  type FbConnectReveal,
} from '@/lib/facebook-connect-messages';

export { fbConnectUserMessage };
export type { FbConnectErrorCode, FbConnectReveal };

export const FB_GRAPH_VERSION = 'v21.0';
export const FB_OAUTH_SCOPES = ['pages_show_list', 'pages_manage_metadata', 'leads_retrieval'].join(',');
export const FB_OAUTH_SESSION_COOKIE = 'fb_oauth_sid';
export const FB_CONNECT_REVEAL_COOKIE = 'fb_connect_reveal';
export const FB_OAUTH_SESSION_TTL_MS = 15 * 60 * 1000;
export const FB_REVEAL_TTL_MS = 10 * 60 * 1000;

export type FbPageChoice = {
  id: string;
  name: string;
  access_token: string;
};

export type FbLeadForm = {
  id: string;
  name: string;
  status?: string;
};

export type FbOauthSessionDoc = {
  sessionId: string;
  resellerId: string;
  clientSlug: string;
  pages: Array<{ id: string; name: string; access_token_enc: string }>;
  expiresAt: Date;
  createdAt: Date;
};

export type ResellerFormulario = ResellerClient['formularios'][number];

const STATE_MAX_AGE_MS = 20 * 60 * 1000;

export function getPublicOrigin(): string {
  const raw =
    process.env.FB_OAUTH_REDIRECT_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.AGENTIA_PUBLIC_URL?.trim() ||
    'https://agentia.software';
  return raw.replace(/\/$/, '');
}

export function getFbOauthRedirectUri(): string {
  if (process.env.FB_OAUTH_REDIRECT_URI?.trim()) {
    return process.env.FB_OAUTH_REDIRECT_URI.trim();
  }
  return `${getPublicOrigin()}/api/portal/facebook/oauth/callback`;
}

export function getFbAppId(): string {
  return (process.env.FB_APP_ID || process.env.FACEBOOK_APP_ID || '').trim();
}

function hmacSecret(): string {
  return (process.env.FB_APP_SECRET || process.env.FB_TOKEN_ENCRYPTION_KEY || 'fb-oauth-fallback').trim();
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', hmacSecret()).update(payload).digest('base64url');
}

export function signOauthState(resellerId: string, clientSlug: string): string {
  const body = JSON.stringify({
    r: resellerId,
    c: clientSlug,
    n: crypto.randomBytes(8).toString('hex'),
    e: Date.now() + STATE_MAX_AGE_MS,
  });
  const payload = Buffer.from(body).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

export function verifyOauthState(state: string): { resellerId: string; clientSlug: string } | null {
  const idx = state.lastIndexOf('.');
  if (idx < 1) return null;
  const payload = state.slice(0, idx);
  const sig = state.slice(idx + 1);
  const expected = signPayload(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      r?: string;
      c?: string;
      e?: number;
    };
    if (!parsed.r || !parsed.c || !parsed.e || Date.now() > parsed.e) return null;
    return { resellerId: parsed.r, clientSlug: parsed.c };
  } catch {
    return null;
  }
}

export function signReveal(data: FbConnectReveal): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

export function verifyReveal(token: string): FbConnectReveal | null {
  const idx = token.lastIndexOf('.');
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = signPayload(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as FbConnectReveal;
  } catch {
    return null;
  }
}

export function generateClientPortalPassword(nombre: string): string {
  const first = String(nombre || '')
    .trim()
    .split(/\s+/)[0] || 'cliente';
  const clean = first
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${clean || 'cliente'}${new Date().getFullYear()}`;
}

export function mergeFormularios(
  existing: ResellerFormulario[] | undefined,
  incoming: FbLeadForm[],
): ResellerFormulario[] {
  const incomingIds = new Set(
    incoming.map((f) => String(f.id || '').trim()).filter(Boolean),
  );
  const map = new Map<string, ResellerFormulario>();
  for (const f of existing ?? []) {
    const id = String(f.formId || '').trim();
    if (!id) continue;
    map.set(id, {
      ...f,
      formId: id,
      activo: incomingIds.has(id),
    });
  }
  for (const form of incoming) {
    const id = String(form.id || '').trim();
    if (!id) continue;
    const prev = map.get(id);
    map.set(id, {
      formId: id,
      formName: (form.name || '').trim() || prev?.formName || id,
      plataforma: prev?.plataforma || 'fb/ig',
      activo: true,
    });
  }
  return Array.from(map.values());
}

export function buildFacebookOauthUrl(state: string): string {
  const appId = getFbAppId();
  const redirectUri = getFbOauthRedirectUri();
  const configId = process.env.FB_LOGIN_CONFIG_ID?.trim();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: 'code',
    auth_type: 'rerequest',
  });
  if (configId) {
    params.set('config_id', configId);
  } else {
    params.set('scope', FB_OAUTH_SCOPES);
  }
  return `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

type GraphErrorBody = {
  error?: { message?: string; error_user_msg?: string; error_user_title?: string; code?: number };
};

async function graphRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  const json = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!res.ok || json.error) {
    const msg =
      json.error?.error_user_msg ||
      json.error?.error_user_title ||
      json.error?.message ||
      `Graph API ${res.status}`;
    const err = new Error(msg) as Error & { graphCode?: number };
    err.graphCode = json.error?.code;
    throw err;
  }
  return json;
}

export async function exchangeCodeForUserToken(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: getFbAppId(),
    client_secret: process.env.FB_APP_SECRET || '',
    redirect_uri: getFbOauthRedirectUri(),
    code,
  });
  const data = await graphRequest<{ access_token?: string }>(
    `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token?${params.toString()}`,
  );
  if (!data.access_token) throw new Error('Sin access_token en el intercambio OAuth');
  return data.access_token;
}

export async function exchangeForLongLivedUserToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: getFbAppId(),
    client_secret: process.env.FB_APP_SECRET || '',
    fb_exchange_token: shortToken,
  });
  try {
    const data = await graphRequest<{ access_token?: string }>(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token?${params.toString()}`,
    );
    return data.access_token || shortToken;
  } catch {
    return shortToken;
  }
}

async function graphCollect<T>(firstUrl: string): Promise<T[]> {
  const out: T[] = [];
  let nextUrl: string | undefined = firstUrl;
  let guard = 0;
  while (nextUrl && guard < 10) {
    const chunk: { data?: T[]; paging?: { next?: string } } = await graphRequest(nextUrl);
    if (Array.isArray(chunk.data)) out.push(...chunk.data);
    nextUrl = chunk.paging?.next;
    guard += 1;
  }
  return out;
}

export async function listUserPages(userToken: string): Promise<FbPageChoice[]> {
  const url =
    `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts` +
    `?fields=id,name,access_token` +
    `&limit=50` +
    `&access_token=${encodeURIComponent(userToken)}`;
  const rows = await graphCollect<{ id?: string; name?: string; access_token?: string }>(url);
  return rows
    .filter((p) => p.id && p.access_token)
    .map((p) => ({
      id: String(p.id),
      name: String(p.name || p.id),
      access_token: String(p.access_token),
    }));
}

export async function listPageLeadgenForms(pageId: string, pageToken: string): Promise<FbLeadForm[]> {
  const url =
    `https://graph.facebook.com/${FB_GRAPH_VERSION}/${encodeURIComponent(pageId)}/leadgen_forms` +
    `?fields=id,name,status` +
    `&limit=50` +
    `&access_token=${encodeURIComponent(pageToken)}`;
  const rows = await graphCollect<{ id?: string; name?: string; status?: string }>(url);
  return rows
    .filter((f) => f.id)
    .map((f) => ({
      id: String(f.id),
      name: String(f.name || f.id),
      status: f.status ? String(f.status).toUpperCase() : undefined,
    }));
}

export function usableLeadgenForms(forms: FbLeadForm[]): FbLeadForm[] {
  return forms.filter((f) => isUsableLeadgenStatus(f.status));
}

const LEADGEN_UNUSABLE_STATUS = new Set(['ARCHIVED', 'DELETED']);

export function isUsableLeadgenStatus(status: string | undefined): boolean {
  if (!status) return true;
  return !LEADGEN_UNUSABLE_STATUS.has(status);
}

export function summarizeLeadgenForms(forms: FbLeadForm[]): string {
  return forms
    .map((f) => `${f.name || f.id} (${f.status || 'sin estado'})`)
    .join(', ');
}

export async function subscribePageToLeadgen(pageId: string, pageToken: string): Promise<void> {
  const url = `https://graph.facebook.com/${FB_GRAPH_VERSION}/${encodeURIComponent(pageId)}/subscribed_apps`;
  const body = new URLSearchParams({
    subscribed_fields: 'leadgen',
    access_token: pageToken,
  });
  const data = await graphRequest<{ success?: boolean }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (data.success === false) {
    throw new Error('subscribed_apps devolvió success=false');
  }
}

export async function saveOauthSession(doc: FbOauthSessionDoc): Promise<void> {
  const db = await getMongoDb();
  await db.collection('fb_oauth_sessions').updateOne(
    { sessionId: doc.sessionId },
    { $set: doc },
    { upsert: true },
  );
}

export async function loadOauthSession(sessionId: string): Promise<FbOauthSessionDoc | null> {
  if (!sessionId) return null;
  const db = await getMongoDb();
  const doc = await db.collection<FbOauthSessionDoc>('fb_oauth_sessions').findOne({ sessionId });
  if (!doc) return null;
  if (new Date(doc.expiresAt).getTime() < Date.now()) {
    await db.collection('fb_oauth_sessions').deleteOne({ sessionId });
    return null;
  }
  return doc;
}

export async function deleteOauthSession(sessionId: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection('fb_oauth_sessions').deleteOne({ sessionId });
}

export function newOauthSessionId(): string {
  return crypto.randomBytes(24).toString('hex');
}

export type CompleteFbConnectionResult =
  | { ok: true; reveal: FbConnectReveal | null; pageName: string; formsCount: number }
  | { ok: false; code: FbConnectErrorCode; message: string };

export async function completeFacebookPageConnection(opts: {
  resellerId: string;
  clientSlug: string;
  page: FbPageChoice;
}): Promise<CompleteFbConnectionResult> {
  const { resellerId, clientSlug, page } = opts;
  const db = await getMongoDb();
  const filter = {
    _collection_type: 'reseller_client' as const,
    resellerId,
    clientSlug,
  };
  const client = await db.collection<ResellerClient>('leads').findOne(filter);
  if (!client) {
    return { ok: false, code: 'generic', message: 'No encontramos ese cliente. Volvé al listado e intentá de nuevo.' };
  }

  let listed: FbLeadForm[];
  try {
    listed = await listPageLeadgenForms(page.id, page.access_token);
  } catch (err) {
    console.error('[fb-connect] leadgen_forms', (err as Error).message);
    return {
      ok: false,
      code: 'no_forms',
      message:
        'No pudimos leer los formularios de esa página. Revisá que el perfil tenga permiso para ver leads y volvé a intentar.',
    };
  }
  console.log(
    '[fb-connect] leadgen_forms',
    page.id,
    listed.length ? summarizeLeadgenForms(listed) : '(ninguno)',
  );
  const forms = usableLeadgenForms(listed);
  if (forms.length === 0) {
    if (listed.length > 0) {
      return {
        ok: false,
        code: 'forms_unusable',
        message: `Encontramos formularios, pero no se pueden usar: ${summarizeLeadgenForms(listed)}. Reactivalos en Meta Ads y volvé a conectar.`,
      };
    }
    return { ok: false, code: 'no_forms', message: fbConnectUserMessage('no_forms') };
  }

  try {
    await subscribePageToLeadgen(page.id, page.access_token);
  } catch (err) {
    console.error('[fb-connect] subscribed_apps', (err as Error).message);
    return { ok: false, code: 'subscribe', message: fbConnectUserMessage('subscribe') };
  }

  const wasConnected = client.fb_connection?.status === 'connected';
  const formularios = mergeFormularios(client.formularios, forms);
  let encrypted: string;
  try {
    encrypted = encryptFbToken(page.access_token);
  } catch (err) {
    console.error('[fb-connect] encrypt', (err as Error).message);
    return { ok: false, code: 'config', message: fbConnectUserMessage('config') };
  }

  const now = new Date();
  const $set: Record<string, unknown> = {
    'fb_connection.status': 'connected',
    'fb_connection.page_id': page.id,
    'fb_connection.page_name': page.name,
    'fb_connection.page_access_token': encrypted,
    'fb_connection.connected_at': now,
    formularios,
    updatedAt: now,
  };

  let reveal: FbConnectReveal | null = null;
  if (!wasConnected) {
    const password = generateClientPortalPassword(client.nombre);
    $set.clientPasswordHash = hashClientPassword(password);
    reveal = {
      clientSlug,
      nombre: client.nombre,
      password,
      portalUrl: `${getPublicOrigin()}/portal/${resellerId}/cliente/${clientSlug}`,
      pageName: page.name,
      formsCount: forms.length,
    };
  }

  await db.collection('leads').updateOne(filter, { $set });
  return { ok: true, reveal, pageName: page.name, formsCount: forms.length };
}

export async function resolvePageAccessToken(pageId: string): Promise<string | null> {
  if (!pageId) return process.env.FB_PAGE_ACCESS_TOKEN?.trim() || null;
  try {
    const db = await getMongoDb();
    const client = await db.collection<ResellerClient>('leads').findOne(
      {
        _collection_type: 'reseller_client',
        'fb_connection.page_id': pageId,
        'fb_connection.status': 'connected',
      },
      { projection: { 'fb_connection.page_access_token': 1 } },
    );
    const packed = client?.fb_connection?.page_access_token;
    if (packed) {
      try {
        return decryptFbToken(packed);
      } catch (err) {
        console.error('[fb-connect] no se pudo descifrar page token', (err as Error).message);
      }
    }
  } catch (err) {
    console.error('[fb-connect] resolvePageAccessToken', (err as Error).message);
  }
  return process.env.FB_PAGE_ACCESS_TOKEN?.trim() || null;
}

export type MetaLeadRecord = {
  field_data?: Array<{ name: string; values: string[] }>;
  form_id?: string;
  ad_id?: string;
  ad_name?: string;
  adset_name?: string;
  campaign_name?: string;
};

export async function fetchMetaLeadById(leadgenId: string, pageId: string): Promise<MetaLeadRecord | null> {
  if (!leadgenId) return null;
  const token = await resolvePageAccessToken(pageId);
  if (!token) {
    console.warn('[fb-connect] sin page token para leadgen_id', leadgenId, 'page', pageId);
    return null;
  }
  try {
    const fields = [
      'id',
      'created_time',
      'ad_id',
      'ad_name',
      'adset_id',
      'adset_name',
      'campaign_id',
      'campaign_name',
      'form_id',
      'field_data',
      'platform',
    ].join(',');
    const url =
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/${encodeURIComponent(leadgenId)}` +
      `?fields=${fields}` +
      `&access_token=${encodeURIComponent(token)}`;
    return await graphRequest<MetaLeadRecord>(url);
  } catch (err) {
    console.error('[fb-connect] GET leadgen', leadgenId, (err as Error).message);
    return null;
  }
}
