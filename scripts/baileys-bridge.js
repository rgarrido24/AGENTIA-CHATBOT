/**
 * Baileys WhatsApp Bridge — sin Chrome/Puppeteer.
 *
 * - Multi-client: AGENTIA_WHATSAPP_CLIENT_IDS (coma) o AGENTIA_WHATSAPP_CLIENT_ID
 * - Sesión persistente: .baileys_auth_<clientId>/
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

async function pollAndSendAlerts() {
  if (!ENABLE_ALERTS) return;
  const alertSenderClientId = String(
    getEnv('AGENTIA_ALERTS_SENDER_CLIENT_ID', '') || 'agentia-ventas'
  )
    .trim()
    .toLowerCase();
  const sock = getStrictReadySock(alertSenderClientId);
  if (!sock) return;
  const alertNumber = getEnv('ALERT_WHATSAPP_NUMBER', '') || process.env.ALERT_WHATSAPP_NUMBER;
  if (!alertNumber) return;
  const apiBase = getApiBase();
  const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
  try {
    const res = await fetch(`${apiBase}/api/alerts/pending`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const alerts = data.alerts || [];
    const sentIds = [];
    const jid = toBaileysJid(alertNumber);
    for (const a of alerts) {
      try {
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
          default:
            msg = `📣 *ALERTA – ${(a.reason || '').toUpperCase()}*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
        }
        await sendText(sock, jid, msg);
        sentIds.push(a.id);
      } catch (e) {
        console.error('[Baileys] Error enviando alerta:', e?.message || e);
      }
    }
    if (sentIds.length > 0) {
      await fetch(`${apiBase}/api/alerts/sent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({ ids: sentIds }),
      }).catch(() => {});
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
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = baileys;

  let state = clients.get(id);
  if (!state) {
    state = { sock: null, ready: false, state: 'boot', reconnectAttempt: 0, starting: false, lastQr: null, qrTimer: null };
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

  const authDir = path.join(__dirname, '..', `.baileys_auth_${id}`);
  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);
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
    browser: ['Agentia', 'Chrome', '120.0.0'],
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
          console.log(`[Baileys] (${id}) QR expiró (60s) — reiniciando para nuevo QR`);
          startClient(id, baileys).catch((e) => {
            console.error(`[Baileys] (${id}) Error reiniciando por QR timeout:`, e?.message || e);
          });
        }
      }, 60_000);
      console.log(`[Baileys] (${id}) QR — escanear en ${getApiBase()}/api/whatsapp/qr?clientId=${encodeURIComponent(id)}`);
      await saveQrToMongo(id, qr);
      await postQrToApi(id, { qr });
    }

    if (connection === 'open') {
      if (state.qrTimer) { clearTimeout(state.qrTimer); state.qrTimer = null; }
      state.state = 'ready';
      state.ready = true;
      state.reconnectAttempt = 0;
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
        console.error(`[Baileys] (${id}) Sesión cerrada — re-escanear QR.`);
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
        if (!body && !hasMedia) continue;

        const senderId = remoteJid;
        const senderName = msg.pushName || undefined;

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
            body || '[imagen adjunta]',
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
  console.log('[Baileys] MongoDB:', MONGODB_URI ? 'configurado' : 'NO — QR solo vía API');

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
