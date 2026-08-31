/**
 * Baileys WhatsApp Bridge — sin Chrome/Puppeteer.
 *
 * - Multi-client: AGENTIA_WHATSAPP_CLIENT_IDS (coma) o AGENTIA_WHATSAPP_CLIENT_ID
 * - Sesión persistente: MongoDB colección `whatsapp_sessions` (creds + keys por clientId)
 * - QR en MongoDB colección whatsapp_qr (+ API qr-store opcional)
 * - Polling outbound_messages cada 5s vía /api/chat/outbound
 * - Health: GET /health en PORT o 10000
 * - Reconexión automática salvo logout
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { MongoClient } = require('mongodb');

// ─── Env helpers ─────────────────────────────────────────────────────────────

function getEnv(key, def) {
  const envDir = path.join(__dirname, '..');
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(envDir, file);
    if (fs.existsSync(envPath)) {
      const text = fs.readFileSync(envPath, 'utf8');
      const re = new RegExp(`^${key}=(.+)$`, 'm');
      const m = text.match(re);
      if (m) {
        let v = m[1].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v) return v;
      }
    }
  }
  return process.env[key] ?? def;
}

function isEnabled(envKey, defaultValue = false) {
  const raw = String(getEnv(envKey, '') || '').trim().toLowerCase();
  if (!raw) return defaultValue;
  if (['1', 'true', 'yes', 'y', 'on', 'enable', 'enabled'].includes(raw)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'disable', 'disabled'].includes(raw)) return false;
  return defaultValue;
}

function isIzziFamily(clientId) {
  const c = String(clientId || '').trim().toLowerCase();
  return c === 'izzi' || c.startsWith('izzi-');
}

const API_URL = (getEnv('AGENTIA_CHATBOT_API_URL', '') || 'http://localhost:3010').replace(/\/$/, '');
const CLIENT_IDS = String(getEnv('AGENTIA_WHATSAPP_CLIENT_IDS', '') || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const CLIENT_ID = getEnv('AGENTIA_WHATSAPP_CLIENT_ID', 'agentia').trim().toLowerCase();
const ACTIVE_CLIENT_IDS = (CLIENT_IDS.length > 0 ? CLIENT_IDS : [CLIENT_ID]).filter(Boolean);
const MONGODB_URI = getEnv('MONGODB_URI', '').trim();
const MONGODB_DB = getEnv('MONGODB_DB', '').trim();
const HEALTH_PORT = Number(getEnv('PORT', process.env.PORT || '10000')) || 10000;

const ENABLE_OUTBOUND_MESSAGES = isEnabled('AGENTIA_ENABLE_OUTBOUND_MESSAGES', true);
const ENABLE_ALERTS = isEnabled('AGENTIA_ENABLE_ALERTS', true);

// ─── Utilidades ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getApiBase() {
  const webhookUrl = (getEnv('CHATBOT_WEBHOOK_URL', '') || '').trim();
  if (webhookUrl) {
    try {
      return new URL(webhookUrl).origin.replace(/\/$/, '');
    } catch {
      /* ignore */
    }
  }
  return API_URL;
}

function normalizeLeadId(senderId) {
  const raw = typeof senderId === 'string' ? senderId : '';
  const digits = raw.replace(/\D/g, '');
  return digits || raw;
}

function normalizeWhatsappDigits(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('56') && digits.length >= 10) return digits;
  if (digits.startsWith('52') && digits.length >= 10) return digits;
  if (!digits.startsWith('54') && (digits.length === 10 || digits.length === 11)) {
    digits = `54${digits}`;
  }
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length >= 11) {
    return `549${digits.slice(2)}`;
  }
  return digits;
}

function toBaileysJid(senderId) {
  const raw = String(senderId || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) {
    if (raw.endsWith('@c.us')) return raw.replace(/@c\.us$/, '@s.whatsapp.net');
    return raw;
  }
  const digits = normalizeWhatsappDigits(raw);
  return digits ? `${digits}@s.whatsapp.net` : '';
}

function extractMessageText(msg) {
  const m = msg?.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  ).trim();
}

function hasMediaContent(msg) {
  const m = msg?.message;
  if (!m) return false;
  return !!(m.imageMessage || m.documentMessage || m.videoMessage || m.audioMessage || m.stickerMessage);
}

function getMediaMime(msg) {
  const m = msg?.message;
  if (!m) return 'image/jpeg';
  if (m.imageMessage) return m.imageMessage.mimetype || 'image/jpeg';
  if (m.documentMessage) return m.documentMessage.mimetype || 'application/octet-stream';
  if (m.videoMessage) return m.videoMessage.mimetype || 'video/mp4';
  if (m.audioMessage) return m.audioMessage.mimetype || 'audio/ogg';
  return 'application/octet-stream';
}

// ─── MongoDB (QR + conexión compartida) ──────────────────────────────────────

let mongoClient = null;
let mongoDb = null;

async function getDb() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI no configurada');
  if (mongoDb) return mongoDb;
  mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  await mongoClient.connect();
  mongoDb = MONGODB_DB ? mongoClient.db(MONGODB_DB) : mongoClient.db();
  return mongoDb;
}

async function saveQrToMongo(clientId, qr) {
  try {
    const cleanQr = typeof qr === 'string'
      ? qr.replace(/^data:[^;]+;base64,/, '').trim()
      : qr;
    const db = await getDb();
    await db.collection('whatsapp_qr').updateOne(
      { _id: clientId },
      { $set: { qr: cleanQr, connected: false, updatedAt: new Date(), clientId } },
      { upsert: true }
    );
    if (clientId === 'agentia') {
      await db.collection('whatsapp_qr').updateOne(
        { _id: 'current' },
        { $set: { qr: cleanQr, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error(`[Baileys] (${clientId}) Error guardando QR en MongoDB:`, e?.message || e);
  }
}

/**
 * Borra las credenciales de un cliente. Tras un logout (401) las creds guardadas
 * quedan inservibles: sin borrarlas, cada arranque reintenta con ellas y nunca se emite QR.
 */
async function clearSessionInMongo(clientId) {
  try {
    const db = await getDb();
    const res = await db.collection('whatsapp_sessions').deleteMany({ clientId });
    console.log(`[Baileys] (${clientId}) Sesión inválida borrada (${res.deletedCount} doc)`);
    return true;
  } catch (e) {
    console.error(`[Baileys] (${clientId}) Error borrando whatsapp_sessions:`, e?.message || e);
    return false;
  }
}

async function setConnectedInMongo(clientId, connected) {
  try {
    const db = await getDb();
    const update = { connected, updatedAt: new Date() };
    if (connected) update.qr = null;
    await db.collection('whatsapp_qr').updateOne(
      { _id: clientId },
      { $set: update, $setOnInsert: { clientId } },
      { upsert: true }
    );
  } catch (e) {
    console.error(`[Baileys] (${clientId}) Error actualizando connected en MongoDB:`, e?.message || e);
  }
}

/**
 * Auth state Baileys en MongoDB (sobrevive redeploys en Railway).
 * Misma semántica que useMultiFileAuthState: creds + keys por tipo/id.
 *
 * @param {import('mongodb').Db} db
 * @param {string} clientId
 * @param {*} baileysPkg — namespace import de @whiskeysockets/baileys
 */
async function useMongoAuthState(db, clientId, baileysPkg) {
  const { initAuthCreds, BufferJSON, proto } = baileysPkg;
  const col = db.collection('whatsapp_sessions');

  await col.createIndex({ clientId: 1 }, { unique: true }).catch(() => {});

  const doc = await col.findOne({ clientId });

  let creds;
  if (doc?.creds && typeof doc.creds === 'object' && Object.keys(doc.creds).length > 0) {
    try {
      creds = JSON.parse(JSON.stringify(doc.creds), BufferJSON.reviver);
    } catch (e) {
      console.warn(`[Baileys] (${clientId}) creds inválidas en MongoDB, usando nuevas:`, e?.message || e);
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
  }

  let inMemoryKeys = {};
  if (doc?.keys && typeof doc.keys === 'object' && Object.keys(doc.keys).length > 0) {
    try {
      inMemoryKeys = JSON.parse(JSON.stringify(doc.keys), BufferJSON.reviver);
    } catch (e) {
      console.warn(`[Baileys] (${clientId}) keys inválidas en MongoDB, iniciando vacío:`, e?.message || e);
      inMemoryKeys = {};
    }
  }

  /** @type {Promise<void>} */
  let persistChain = Promise.resolve();

  async function persistDocument() {
    const payload = {
      clientId,
      creds: JSON.parse(JSON.stringify(creds, BufferJSON.replacer)),
      keys: JSON.parse(JSON.stringify(inMemoryKeys, BufferJSON.replacer)),
      updatedAt: new Date(),
    };
    await col.updateOne({ clientId }, { $set: payload }, { upsert: true });
  }

  function queuePersist() {
    persistChain = persistChain.then(() => persistDocument()).catch((e) => {
      console.error(`[Baileys] (${clientId}) Error persistiendo whatsapp_sessions:`, e?.message || e);
    });
    return persistChain;
  }

  const keysStore = {
    /**
     * @param {string} type
     * @param {string[]} ids
     */
    get: async (type, ids) => {
      const data = {};
      const bucket = inMemoryKeys[type] || {};
      for (const id of ids) {
        let value = bucket[id];
        if (type === 'app-state-sync-key' && value && proto?.Message?.AppStateSyncKeyData) {
          value = proto.Message.AppStateSyncKeyData.fromObject(
            typeof value.toJSON === 'function' ? value.toJSON() : value
          );
        }
        data[id] = value;
      }
      return data;
    },
    /**
     * @param {Record<string, Record<string, unknown>>} patch
     */
    set: async (patch) => {
      for (const category of Object.keys(patch)) {
        const inner = patch[category];
        if (!inner || typeof inner !== 'object') continue;
        if (!inMemoryKeys[category]) inMemoryKeys[category] = {};
        for (const id of Object.keys(inner)) {
          const val = inner[id];
          if (val) inMemoryKeys[category][id] = val;
          else delete inMemoryKeys[category][id];
        }
      }
      await queuePersist();
    },
  };

  const saveCreds = async () => {
    await queuePersist();
  };

  return {
    state: {
      creds,
      keys: keysStore,
    },
    saveCreds,
  };
}

async function postQrToApi(clientId, payload) {
  const qrSecret = getEnv('WHATSAPP_QR_SECRET', '') || process.env.WHATSAPP_QR_SECRET;
  const apiBase = getApiBase();
  const url = `${apiBase}/api/whatsapp/qr-store`;
  const headers = {
    'Content-Type': 'application/json',
    ...(qrSecret ? { Authorization: `Bearer ${qrSecret}` } : {}),
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ clientId, ...payload }),
      });
      if (r.ok) return;
    } catch {
      /* ignore */
    }
    if (attempt < 3) await sleep(2000);
  }
}

// ─── Chat API ────────────────────────────────────────────────────────────────

async function callChatApi(clientId, message, senderId, senderName, mediaBase64, mimeType) {
  const webhookUrl = (getEnv('CHATBOT_WEBHOOK_URL', '') || `${getApiBase()}/api/webhook/whatsapp`).replace(/\/$/, '');
  const payload = {
    clientId,
    leadId: normalizeLeadId(senderId),
    mensaje: message || (mediaBase64 ? '[imagen/documento adjunto]' : ''),
    mediaBase64: mediaBase64 || undefined,
    mediaType: mimeType || undefined,
    leadData: {
      telefono: normalizeLeadId(senderId),
      nombre: senderName || undefined,
    },
  };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json.error || `HTTP ${res.status}`;
    console.error('[Baileys] API error:', res.status, json);
    return { reply: '', mediaUrl: null, botPaused: false, error: errMsg, status: res.status };
  }
  const reply = typeof json.mensaje === 'string' ? json.mensaje : typeof json.reply === 'string' ? json.reply : '';
  return { reply: String(reply || '').trim(), mediaUrl: json.mediaUrl || null, botPaused: !!json.botPaused };
}

// ─── Estado por cliente ──────────────────────────────────────────────────────

/** @type {Map<string, { sock: any, ready: boolean, state: string, reconnectAttempt: number, starting: boolean, lastQr: string|null, qrTimer: ReturnType<typeof setTimeout>|null }>} */
const clients = new Map();

function getClientState(id) {
  return clients.get(String(id || '').trim().toLowerCase());
}

function getStrictReadySock(clientId) {
  const st = getClientState(clientId);
  return st?.ready && st?.sock ? st.sock : null;
}

const senderQueues = new Map();

function enqueueAndProcess(key, fn) {
  const prev = senderQueues.get(key) || Promise.resolve();
  const next = prev
    .then(() => fn())
    .catch((e) => console.error('[Baileys] Error en cola:', e?.message || String(e)));
  senderQueues.set(key, next);
  next.finally(() => {
    if (senderQueues.get(key) === next) senderQueues.delete(key);
  });
  return next;
}

// ─── Envío de mensajes ───────────────────────────────────────────────────────

async function sendText(sock, jid, text) {
  if (!text) return;
  await sock.sendMessage(jid, { text });
}

const {
  normalizeWhatsAppTo,
  buildPortalLink,
  sendResellerLeadPanelTemplate,
} = require('./lib/reseller-lead-panel-alert');
const RESELLER_ALERT_RECEIPT_SUFFIX = '\n\nResponde con ✅ para confirmar recepción';

/** Resellers con alertas high_activity vía plantilla Graph API (no clientes internos). */
const EXTERNAL_RESELLERS = ['luciano'];

/** Tope de recuperaciones automáticas tras logout, para no reiniciar en bucle. */
const MAX_LOGOUT_RECOVERIES = 3;

/** Clientes dados de baja: sus alertas se descartan sin enviar. */
const DISABLED_ALERT_CLIENT_IDS = new Set(['decohouse', 'biovela']);

function isDisabledAlertClient(a) {
  const id = String(a.resellerId || a.clientId || '')
    .trim()
    .toLowerCase();
  return DISABLED_ALERT_CLIENT_IDS.has(id) || a.reason === 'decohouse_lead';
}

function shouldAppendResellerReceiptSuffix(resellerId) {
  const s = String(resellerId ?? '')
    .trim()
    .toLowerCase();
  return s.length > 0 && s !== 'unknown';
}

function effectiveResellerId(a) {
  return String(a.resellerId || a.clientId || '')
    .trim()
    .toLowerCase();
}

/** high_activity reseller externo → plantilla Graph API (no requiere socket Baileys). */
function isResellerGraphHighActivityAlert(a) {
  const effectiveId = String(a.resellerId || a.clientId || '')
    .trim()
    .toLowerCase();
  const passes =
    EXTERNAL_RESELLERS.includes(effectiveId) &&
    a.reason === 'high_activity' &&
    !!a.notifyWhatsappTo;
  console.log('[RESELLER CHECK]', {
    reason: a.reason,
    resellerId: a.resellerId,
    clientId: a.clientId,
    effectiveId,
    notifyWhatsappTo: a.notifyWhatsappTo,
    check1_reason: a.reason === 'high_activity',
    check2_notify: !!a.notifyWhatsappTo,
    check3_reseller: EXTERNAL_RESELLERS.includes(effectiveId),
    passes,
  });
  return passes;
}

/** Lead en Mongo con resellerId válido (ej. cliente de Luciano vía mismo WhatsApp Izzi). */
async function isIzziInboundFromResellerLead(senderId) {
  if (!MONGODB_URI) return false;
  try {
    const db = await getDb();
    const full = String(senderId || '').trim();
    const bare = full.replace(/@[^@]+$/, '');
    const digits = bare.replace(/\D/g, '');
    const or = [];
    if (full) or.push({ senderId: full });
    if (bare && bare !== full) or.push({ senderId: bare });
    if (digits) {
      or.push({ senderId: digits });
      if (digits.length >= 10) {
        or.push({ senderId: { $regex: digits.slice(-10) } });
      }
    }
    if (!or.length) return false;
    const doc = await db.collection('leads').findOne({ $or: or }, { projection: { resellerId: 1 } });
    return !!(doc && shouldAppendResellerReceiptSuffix(doc.resellerId));
  } catch (e) {
    console.warn('[Baileys] isIzziInboundFromResellerLead:', e?.message || e);
    return false;
  }
}

/**
 * Cliente portal (`leads`): `alertNumber` contiene los dígitos del número (destino de la alerta).
 * @returns {Promise<{ clientSlug?: string, resellerId?: string, alertNumber?: string } | null>}
 */
async function getClienteDocByAlertNumber(notifyWhatsappTo) {
  if (!MONGODB_URI) return null;
  const digits = String(notifyWhatsappTo ?? '')
    .replace(/\D/g, '');
  if (digits.length < 8) return null;
  try {
    const db = await getDb();
    const tail = digits.slice(-10);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const doc = await db.collection('leads').findOne(
      {
        alertNumber: { $exists: true, $nin: ['', null] },
        $or: [{ alertNumber: { $regex: esc(tail) } }, { alertNumber: { $regex: esc(digits) } }],
      },
      { projection: { clientSlug: 1, resellerId: 1, alertNumber: 1 }, sort: { updatedAt: -1 } }
    );
    return doc;
  } catch (e) {
    console.warn('[Baileys] getClienteDocByAlertNumber:', e?.message || e);
    return null;
  }
}

/**
 * Busca en `leads` por leadId o senderId para armar el link del portal reseller.
 * @returns {{ resellerId: string, clientSlug: string, leadId: string } | null}
 */
async function findResellerPortalMetaForAlert(a) {
  if (!MONGODB_URI) return null;
  try {
    const db = await getDb();
    const leadId = String(a.leadId || '').trim();
    const senderRaw = a.senderId ? String(a.senderId).replace(/@.*$/, '').trim() : '';
    const senderDigits = senderRaw.replace(/\D/g, '');

    let doc = null;
    if (leadId) {
      doc = await db.collection('leads').findOne(
        { leadId },
        { projection: { resellerId: 1, clientSlug: 1, leadId: 1 } }
      );
    }
    if (!doc && senderRaw) {
      const or = [{ senderId: senderRaw }];
      if (senderDigits && senderDigits !== senderRaw) or.push({ senderId: senderDigits });
      doc = await db.collection('leads').findOne(
        { $or: or },
        { projection: { resellerId: 1, clientSlug: 1, leadId: 1 }, sort: { updatedAt: -1 } }
      );
    }
    if (!doc && senderRaw && shouldAppendResellerReceiptSuffix(a.resellerId)) {
      const rid = String(a.resellerId || '').trim();
      doc = await db.collection('leads').findOne(
        {
          resellerId: rid,
          $or: [{ senderId: senderRaw }, ...(senderDigits ? [{ senderId: senderDigits }] : [])],
        },
        { projection: { resellerId: 1, clientSlug: 1, leadId: 1 }, sort: { updatedAt: -1 } }
      );
    }
    if (!doc) return null;

    const resellerId = String(doc.resellerId || a.resellerId || '')
      .trim()
      .toLowerCase();
    const clientSlug = String(doc.clientSlug || '').trim();
    const outLeadId = String(doc.leadId || leadId || '').trim();
    if (!resellerId || resellerId === 'unknown' || !clientSlug) return null;
    return { resellerId, clientSlug, leadId: outLeadId };
  } catch (e) {
    console.warn('[Baileys] findResellerPortalMetaForAlert:', e?.message || e);
    return null;
  }
}

/** Solo AGENTIA Cloud API — nunca WHATSAPP_PHONE_NUMBER_ID (CWF). */
function getResellerAlertPhoneNumberId() {
  return String(
    getEnv('AGENTIA_WHATSAPP_PHONE_NUMBER_ID', '') || process.env.AGENTIA_WHATSAPP_PHONE_NUMBER_ID || ''
  ).trim();
}

/** Alerta high_activity reseller: plantilla oficial WhatsApp Cloud API `nuevo_lead_panel`. */
async function sendResellerHighActivityWithOg(_sock, _jid, a) {
  let meta = await findResellerPortalMetaForAlert(a);
  let clientSlug = meta?.clientSlug ? String(meta.clientSlug).trim() : '';
  let resellerId = meta?.resellerId || String(a.resellerId || 'luciano').trim().toLowerCase();

  if (!clientSlug) {
    const cliente = await getClienteDocByAlertNumber(a.notifyWhatsappTo);
    if (cliente?.clientSlug) {
      clientSlug = String(cliente.clientSlug).trim();
    }
    if (cliente?.resellerId) {
      resellerId = String(cliente.resellerId).trim().toLowerCase();
    }
  }

  const portalLink = buildPortalLink(resellerId, clientSlug);
  const alertNumber =
    normalizeWhatsAppTo(a.notifyWhatsappTo) ||
    normalizeWhatsAppTo(getEnv('ALERT_WHATSAPP_NUMBER', '') || process.env.ALERT_WHATSAPP_NUMBER);

  return sendResellerLeadPanelTemplate({
    alertNumber,
    portalLink,
    phoneNumberId: getResellerAlertPhoneNumberId(),
    accessToken: getEnv('WHATSAPP_ACCESS_TOKEN', '') || process.env.WHATSAPP_ACCESS_TOKEN,
    logPrefix: '[Baileys]',
  });
}

async function sendWithOptionalMedia(sock, jid, text, mediaUrl) {
  if (mediaUrl) {
    try {
      const r = await fetch(mediaUrl);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const mime = (r.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
      if (mime.startsWith('video/')) {
        await sock.sendMessage(jid, { video: buf, mimetype: mime, caption: text || undefined });
      } else if (mime.startsWith('audio/')) {
        await sock.sendMessage(jid, { audio: buf, mimetype: mime, ptt: mime.includes('ogg') });
        if (text) await sock.sendMessage(jid, { text });
      } else {
        await sock.sendMessage(jid, { image: buf, mimetype: mime, caption: text || undefined });
      }
      return;
    } catch (e) {
      console.warn('[Baileys] Media falló, enviando solo texto:', e?.message || e);
    }
  }
  await sendText(sock, jid, text);
}

// ─── Outbound polling ──────────────────────────────────────────────────────────

async function pollAndSendOutboundMessages() {
  if (!ENABLE_OUTBOUND_MESSAGES) return;
  const apiBase = getApiBase();
  const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
  try {
    const res = await fetch(`${apiBase}/api/chat/outbound`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    const data = await res.json().catch(() => ({}));
    const items = data.messages || [];
    for (const m of items) {
      try {
        const msgClientId = String(m.clientId || '').trim().toLowerCase();
        const sock = getStrictReadySock(msgClientId);
        if (!sock) {
          const readyList =
            ACTIVE_CLIENT_IDS.filter((id) => getClientState(id)?.ready).join(', ') || 'ninguno';
          const why = !msgClientId
            ? `outbound sin clientId (bridges listos: ${readyList})`
            : `bridge no listo para clientId=${msgClientId} (listos: ${readyList})`;
          const secret0 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
          await fetch(`${apiBase}/api/chat/outbound/error`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(secret0 ? { Authorization: `Bearer ${secret0}` } : {}),
            },
            body: JSON.stringify({ id: m._id, error: why }),
          }).catch(() => {});
          continue;
        }
        const raw = m.senderId && typeof m.senderId === 'string' ? m.senderId.trim() : '';
        const jid = toBaileysJid(raw);
        if (!jid || jid === '@s.whatsapp.net' || jid.length < 14) {
          await fetch(`${apiBase}/api/chat/outbound/error`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: m._id, error: `senderId inválido: "${raw}"` }),
          }).catch(() => {});
          continue;
        }
        await sendWithOptionalMedia(sock, jid, m.message, m.mediaUrl);
        const secret2 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
        await fetch(`${apiBase}/api/chat/outbound`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret2 ? { Authorization: `Bearer ${secret2}` } : {}),
          },
          body: JSON.stringify({ id: m._id }),
        });
        console.log('[Baileys] Outbound enviado a', raw, m.mediaUrl ? '(con media)' : '');
      } catch (e) {
        const msg = e?.message || String(e);
        console.error('[Baileys] Error enviando outbound:', msg, 'id=', m._id);
        try {
          const secret3 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
          await fetch(`${apiBase}/api/chat/outbound/error`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(secret3 ? { Authorization: `Bearer ${secret3}` } : {}),
            },
            body: JSON.stringify({ id: m._id, error: msg }),
          });
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    console.error('[Baileys] Error poll outbound:', e?.message || e);
  }
}

async function tryClaimAlert(apiBase, secret, alertId) {
  try {
    const res = await fetch(`${apiBase}/api/alerts/sent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Alert-Marker': 'baileys-bridge',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ ids: [alertId] }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return (data.marked || 0) > 0;
  } catch {
    return false;
  }
}

async function pollAndSendAlerts() {
  if (!ENABLE_ALERTS) return;
  const alertSenderClientId = String(
    getEnv('AGENTIA_ALERTS_SENDER_CLIENT_ID', '') || 'agentia-ventas'
  )
    .trim()
    .toLowerCase();
  const sock = getStrictReadySock(alertSenderClientId);
  if (!sock) {
    console.warn(
      '[Baileys] Sin socket Baileys para alertas — solo alertas reseller high_activity vía Graph API'
    );
  }
  const defaultAlertNumber = getEnv('ALERT_WHATSAPP_NUMBER', '') || process.env.ALERT_WHATSAPP_NUMBER || '';
  if (!defaultAlertNumber) {
    console.warn('[Baileys] ALERT_WHATSAPP_NUMBER vacío — solo alertas con notifyWhatsappTo propio.');
  }
  const apiBase = getApiBase();
  const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
  try {
    const res = await fetch(`${apiBase}/api/alerts/pending`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const alerts = data.alerts || [];
    console.log(
      '[PENDING] Total alertas:',
      alerts.length,
      alerts.map((a) => ({ reason: a.reason, resellerId: a.resellerId || a.clientId }))
    );
    for (const a of alerts) {
      try {
        console.log('[POLL] Alerta encontrada:', {
          id: a._id,
          reason: a.reason,
          resellerId: a.resellerId || a.clientId,
          notifyWhatsappTo: a.notifyWhatsappTo,
          isReseller: !!(a.resellerId && a.resellerId !== 'unknown' && a.notifyWhatsappTo),
        });

        const claimed = await tryClaimAlert(apiBase, secret, a.id);
        if (!claimed) {
          console.log('[Baileys] Alerta ya reclamada/enviada (omitir):', a.id, a.reason);
          continue;
        }

        // Se reclama primero para que la alerta no vuelva en cada poll.
        if (isDisabledAlertClient(a)) {
          console.log('[Baileys] Cliente dado de baja — alerta descartada:', a.reason, a.id);
          continue;
        }

        if (isResellerGraphHighActivityAlert(a)) {
          const alertDoc = { ...a, resellerId: effectiveResellerId(a) };
          await sendResellerHighActivityWithOg(null, null, alertDoc);
          await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
          continue;
        }

        const fromDoc = a.notifyWhatsappTo && String(a.notifyWhatsappTo).trim();
        const targetRaw = fromDoc || defaultAlertNumber;
        if (!targetRaw) {
          console.warn('[Baileys] Alerta sin destino WA (omitir):', a.reason, a.id);
          continue;
        }
        const senderLine = a.senderId ? `📱 ${String(a.senderId).replace(/@.*$/, '')}` : '';
        let msg = '';
        switch (a.reason) {
          case 'documents_confirmed':
            msg = `📋 *CAPTURAR EN IZZI – VENTA LISTA*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
            break;
          case 'sale_closed':
            msg = `✅ *VENTA CERRADA*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
            break;
          case 'urgent_keyword':
            msg = `🚨 *LEAD URGENTE*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
            break;
          case 'high_activity': {
            const clienteDoc = await getClienteDocByAlertNumber(a.notifyWhatsappTo);
            const clientSlug = clienteDoc?.clientSlug || '';
            const resellerId = clienteDoc?.resellerId || 'luciano';
            const portalLink = clientSlug
              ? `https://agentia.software/portal/${resellerId}/cliente/${clientSlug}`
              : 'https://agentia.software/dashboard/leads';

            msg = `⚠️ ATENCION⚠️\n¡Tenes un NUEVO LEAD en tu panel!\nNo dejes que se enfríe y contactalo rápidamente📲\nDale click al enlace para gestionarlo👇\n${portalLink}`;
            break;
          }
          default:
            msg = `📣 *ALERTA – ${(a.reason || '').toUpperCase()}*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
        }
        if (!sock) {
          console.warn('[Baileys] Alerta omitida (sin socket Baileys):', a.reason, a.id);
          continue;
        }
        const jid = toBaileysJid(targetRaw);
        if (!jid) {
          console.warn('[Baileys] JID inválido para alerta:', a.reason, targetRaw);
          continue;
        }
        if (shouldAppendResellerReceiptSuffix(effectiveResellerId(a))) {
          msg += RESELLER_ALERT_RECEIPT_SUFFIX;
        }
        await sendText(sock, jid, msg);
        await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
      } catch (e) {
        console.error('[Baileys] Error enviando alerta:', e?.message || e);
      }
    }
  } catch (e) {
    console.error('[Baileys] Error poll alerts:', e?.message || e);
  }
}

// ─── Inicialización Baileys por clientId ─────────────────────────────────────

async function startClient(clientId, baileys) {
  const id = String(clientId || '').trim().toLowerCase() || 'agentia';
  const {
    default: makeWASocket,
    DisconnectReason,
    downloadMediaMessage,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
  } = baileys;

  let state = clients.get(id);
  if (!state) {
    state = { sock: null, ready: false, state: 'boot', reconnectAttempt: 0, logoutRecoveries: 0, starting: false, lastQr: null, qrTimer: null };
    clients.set(id, state);
  }
  if (state.starting) {
    console.warn(`[Baileys] (${id}) start ya en curso — omitido`);
    return;
  }
  state.starting = true;
  state.ready = false;
  state.state = 'initializing';

  if (state.sock) {
    try {
      state.sock.ev.removeAllListeners('connection.update');
      state.sock.ev.removeAllListeners('creds.update');
      state.sock.ev.removeAllListeners('messages.upsert');
      state.sock.end(undefined);
    } catch {
      /* ignore */
    }
    state.sock = null;
  }

  const db = await getDb();
  const { state: authState, saveCreds } = await useMongoAuthState(db, id, baileys);
  const { version } = await fetchLatestBaileysVersion();

  const logger = {
    level: 'silent',
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
    child: () => logger,
  };

  const sock = makeWASocket({
    version,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  state.sock = sock;
  state.starting = false;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.state = 'qr';
      state.lastQr = qr;
      // Reiniciar timer: si en 60s no se escanea, forzar nuevo QR
      if (state.qrTimer) clearTimeout(state.qrTimer);
      state.qrTimer = setTimeout(() => {
        state.qrTimer = null;
        if (state.state === 'qr') {
          console.log(`[Baileys] (${id}) QR expiró (120s) — reiniciando para nuevo QR`);
          startClient(id, baileys).catch((e) => {
            console.error(`[Baileys] (${id}) Error reiniciando por QR timeout:`, e?.message || e);
          });
        }
      }, 120_000);
      console.log(`[Baileys] (${id}) QR — escanear en ${getApiBase()}/api/whatsapp/qr?clientId=${encodeURIComponent(id)}`);
      await saveQrToMongo(id, qr);
      await postQrToApi(id, { qr });
    }

    if (connection === 'open') {
      if (state.qrTimer) { clearTimeout(state.qrTimer); state.qrTimer = null; }
      state.state = 'ready';
      state.ready = true;
      state.reconnectAttempt = 0;
      state.logoutRecoveries = 0;
      state.lastQr = null;
      console.log(`[Baileys] (${id}) WhatsApp conectado.`);
      await setConnectedInMongo(id, true);
      await postQrToApi(id, { connected: true });
    }

    if (connection === 'close') {
      if (state.qrTimer) { clearTimeout(state.qrTimer); state.qrTimer = null; }
      state.state = 'disconnected';
      state.ready = false;
      await setConnectedInMongo(id, false);
      await postQrToApi(id, { connected: false });

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      const restartRequired = statusCode === DisconnectReason.restartRequired;

      console.warn(
        `[Baileys] (${id}) Desconectado (code=${statusCode ?? 'unknown'}). loggedOut=${loggedOut}`
      );

      if (loggedOut) {
        state.state = 'logged_out';
        state.logoutRecoveries = (state.logoutRecoveries || 0) + 1;

        if (state.logoutRecoveries > MAX_LOGOUT_RECOVERIES) {
          console.error(
            `[Baileys] (${id}) Sesión cerrada ${state.logoutRecoveries} veces seguidas — se detiene para no entrar en bucle. Reinicia el worker.`
          );
          return;
        }

        console.error(`[Baileys] (${id}) Sesión cerrada — borrando credenciales y pidiendo QR nuevo.`);
        await clearSessionInMongo(id);
        setTimeout(() => {
          startClient(id, baileys).catch((e) => {
            console.error(`[Baileys] (${id}) Error reiniciando tras logout:`, e?.message || e);
          });
        }, 3_000);
        return;
      }

      const delay = Math.min(60_000, 3_000 * Math.max(1, state.reconnectAttempt + 1));
      state.reconnectAttempt += 1;
      console.log(`[Baileys] (${id}) Reconectando en ${Math.round(delay / 1000)}s...`);
      setTimeout(() => {
        startClient(id, baileys).catch((e) => {
          console.error(`[Baileys] (${id}) Error en reconexión:`, e?.message || e);
        });
      }, delay + (restartRequired ? 2000 : 0));
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        const remoteJid = msg.key.remoteJid || '';
        if (!remoteJid || remoteJid === 'status@broadcast') continue;
        if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) continue;

        const body = extractMessageText(msg);
        const hasMedia = hasMediaContent(msg);
        const trimmedBody = String(body || '').trim();
        if (!trimmedBody && !hasMedia) continue;

        const senderId = remoteJid;
        const senderName = msg.pushName || undefined;

        if (isIzziFamily(id) && !hasMedia && trimmedBody) {
          const shortInbound = [...trimmedBody].length < 5;
          if (shortInbound && (await isIzziInboundFromResellerLead(senderId))) {
            await sendText(sock, senderId, '✅ Recibido. ¡Mucha suerte con tu lead!');
            continue;
          }
        }

        let mediaBase64 = null;
        let mimeType = null;
        if (hasMedia) {
          try {
            const buffer = await downloadMediaMessage(
              msg,
              'buffer',
              {},
              { logger, reuploadRequest: sock.updateMediaMessage }
            );
            if (buffer) {
              mediaBase64 = Buffer.from(buffer).toString('base64');
              mimeType = getMediaMime(msg);
            }
          } catch (e) {
            console.warn(`[Baileys] (${id}) No se pudo descargar media:`, e?.message || e);
          }
        }

        const key = `${id}:${senderId}`;
        const processMessage = async () => {
          const { reply, mediaUrl, botPaused } = await callChatApi(
            id,
            trimmedBody || '[imagen adjunta]',
            senderId,
            senderName,
            mediaBase64,
            mimeType
          );
          return { reply, mediaUrl, botPaused };
        };

        const run = async () => {
          const { reply, mediaUrl, botPaused } = hasMedia
            ? await enqueueAndProcess(key, processMessage)
            : await processMessage();
          if (botPaused) return;
          if (reply || mediaUrl) {
            await sendWithOptionalMedia(sock, senderId, reply, mediaUrl);
            return;
          }
          if (!hasMedia) {
            await sendText(sock, senderId, 'Un momento, por favor. 🔄');
          }
        };

        run().catch(async (err) => {
          console.error(`[Baileys] (${id}) Error procesando mensaje:`, err?.message || err);
          try {
            await sendText(sock, senderId, 'Lo siento, hubo un error. Por favor intenta más tarde.');
          } catch {
            /* ignore */
          }
        });
      } catch (e) {
        console.error(`[Baileys] (${id}) Error en messages.upsert:`, e?.message || e);
      }
    }
  });
}

// ─── Health server ───────────────────────────────────────────────────────────

function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (!req.url?.startsWith('/health')) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    const all = ACTIVE_CLIENT_IDS.map((cid) => {
      const st = getClientState(cid);
      return {
        clientId: cid,
        ready: !!st?.ready,
        state: st?.state || 'boot',
        hasQr: !!st?.lastQr,
        reconnectAttempt: st?.reconnectAttempt ?? 0,
      };
    });
    const ok = all.some((c) => c.ready);
    res.statusCode = ok ? 200 : 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify(
        {
          ok,
          engine: 'baileys',
          clients: all,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  });
  server.listen(HEALTH_PORT, () => {
    console.log(`[Baileys] Health en :${HEALTH_PORT}/health`);
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (ACTIVE_CLIENT_IDS.length === 0) {
    console.error('[Baileys] No hay clientIds. Define AGENTIA_WHATSAPP_CLIENT_IDS o AGENTIA_WHATSAPP_CLIENT_ID.');
    process.exit(1);
  }

  console.log('[Baileys] Bridge iniciando...');
  console.log('[Baileys] API URL:', API_URL);
  console.log('[Baileys] Clients:', ACTIVE_CLIENT_IDS.join(', '));
  console.log('[Baileys] MongoDB:', MONGODB_URI ? 'configurado (QR + sesiones whatsapp_sessions)' : 'NO — QR solo vía API');

  let baileys;
  try {
    baileys = await import('@whiskeysockets/baileys');
  } catch (e) {
    console.error('[Baileys] Falta @whiskeysockets/baileys. Ejecuta: npm install');
    process.exit(1);
  }

  startHealthServer();

  for (let i = 0; i < ACTIVE_CLIENT_IDS.length; i++) {
    const cid = ACTIVE_CLIENT_IDS[i];
    setTimeout(() => {
      startClient(cid, baileys).catch((err) => {
        console.error(`[Baileys] (${cid}) Error al iniciar:`, err?.message || err);
      });
    }, i * 8_000);
  }

  if (ENABLE_OUTBOUND_MESSAGES) {
    setTimeout(pollAndSendOutboundMessages, 3_000);
    setInterval(pollAndSendOutboundMessages, 5_000);
  } else {
    console.warn('[Baileys] OUTBOUND deshabilitado (AGENTIA_ENABLE_OUTBOUND_MESSAGES=false)');
  }

  if (ENABLE_ALERTS) {
    setTimeout(pollAndSendAlerts, 15_000);
    setInterval(pollAndSendAlerts, 20_000);
  }
}

process.on('SIGTERM', () => {
  console.log('[Baileys] SIGTERM — cerrando...');
  if (mongoClient) mongoClient.close().catch(() => {});
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGINT', () => {
  console.log('[Baileys] SIGINT — cerrando...');
  if (mongoClient) mongoClient.close().catch(() => {});
  process.exit(0);
});

main().catch((err) => {
  console.error('[Baileys] Fatal:', err?.message || err);
  process.exit(1);
});
