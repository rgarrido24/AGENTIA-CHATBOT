/**
 * WhatsApp Puente - Conexión por QR para Agentia
 *
 * Conecta un número de WhatsApp vía QR y reenvía mensajes al API de chat.
 * Los mensajes usan la IA (conocimiento) y se registran en el CRM.
 *
 * Uso:
 *   1. Configura .env con AGENTIA_CHATBOT_API_URL (ej: https://tu-app.vercel.app)
 *   2. Opcional: AGENTIA_WHATSAPP_CLIENT_ID (default: agentia)
 *   3. Ejecuta: node scripts/whatsapp-bridge.js
 *   4. Escanea el QR con WhatsApp en tu teléfono
 *
 * Requiere: business_config con clientId correspondiente en MongoDB.
 */

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const http = require('http');

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
  return process.env[key] || def;
}

const API_URL = (getEnv('AGENTIA_CHATBOT_API_URL', '') || 'http://localhost:3010').replace(/\/$/, '');
const CLIENT_ID = getEnv('AGENTIA_WHATSAPP_CLIENT_ID', 'agentia').trim().toLowerCase();
const PAGE_ID = 'whatsapp-bridge';

function normalizeLeadId(senderId) {
  const raw = typeof senderId === 'string' ? senderId : '';
  const digits = raw.replace(/\D/g, '');
  return digits || raw;
}

async function callChatApi(message, senderId, senderName, mediaBase64, mimeType) {
  const webhookUrl = (getEnv('CHATBOT_WEBHOOK_URL', '') || `${API_URL}/api/webhook/whatsapp`).replace(/\/$/, '');
  const url = webhookUrl;
  const payload = {
    leadId: normalizeLeadId(senderId),
    mensaje: message || (mediaBase64 ? '[imagen/documento adjunto]' : ''),
    mediaBase64: mediaBase64 || undefined,
    mediaType: mimeType || undefined,
    leadData: {
      telefono: normalizeLeadId(senderId),
      nombre: senderName || undefined,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json.error || `HTTP ${res.status}`;
    console.error('[Agentia] API error:', res.status, json);
    throw new Error(errMsg);
  }
  const reply = typeof json.mensaje === 'string' ? json.mensaje : (typeof json.reply === 'string' ? json.reply : '');
  return { reply: String(reply || '').trim(), mediaUrl: null, botPaused: false };
}

async function main() {
  console.log('[Agentia] WhatsApp Puente iniciando...');
  console.log('[Agentia] API URL:', API_URL);
  console.log('[Agentia] ClientId:', CLIENT_ID);
  console.log('[Agentia] Sesión:', `.wwebjs_auth_${CLIENT_ID}`);
  console.log('');

  // Carpeta de sesión por cliente (evita conflicto con navegador bloqueado)
  const sessionDir = path.join(__dirname, '..', `.wwebjs_auth_${CLIENT_ID}`);
  let client = null;
  let whatsappReady = false;
  let lastQr = null;
  let lastState = 'boot';
  let reconnectAttempt = 0;

  const bridgePort = Number(getEnv('PORT', process.env.PORT || '10000')) || 10000;
  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    if (req.url.startsWith('/health')) {
      const body = JSON.stringify({
        ok: whatsappReady,
        whatsapp: whatsappReady ? 'connected' : 'disconnected',
        state: lastState,
        hasQr: !!lastQr,
        timestamp: new Date().toISOString(),
      });
      res.statusCode = whatsappReady ? 200 : 503;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(body);
      return;
    }
    if (req.url.startsWith('/qr')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, qr: lastQr, timestamp: new Date().toISOString() }));
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  });
  server.listen(bridgePort, () => {
    console.log(`[Agentia] Bridge /health escuchando en :${bridgePort}`);
  });

  function initClient() {
    lastState = 'initializing';
    whatsappReady = false;
    const nextClient = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionDir }),
      puppeteer: { headless: true, args: ['--no-sandbox'] },
    });
    client = nextClient;

    nextClient.on('qr', async (qr) => {
      lastState = 'qr';
      lastQr = qr;
      console.log('\n[Agentia] Escanea el QR con WhatsApp:\n');
      qrcode.generate(qr, { small: true });

      // Envía el QR al API (reintentos por si el Web Service está arrancando en cold start)
      const qrSecret = getEnv('WHATSAPP_QR_SECRET', '') || process.env.WHATSAPP_QR_SECRET;
      const url = `${API_URL}/api/whatsapp/qr-store`;
      const payload = JSON.stringify({ qr });
      const headers = {
        'Content-Type': 'application/json',
        ...(qrSecret ? { Authorization: `Bearer ${qrSecret}` } : {}),
      };
      let lastError = '';
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(url, { method: 'POST', headers, body: payload });
          if (res.ok) {
            console.log('[Agentia] QR enviado al API para vincular desde la web.');
            console.log('[Agentia] En tu celular abre esta URL para ver el QR:', `${API_URL}/api/whatsapp/qr`);
            break;
          }
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            lastError = data.error || text;
          } catch {
            lastError = text.slice(0, 200);
          }
          if (attempt < 3) {
            console.log('[Agentia] QR no enviado al API:', res.status, '- reintento en 8s...');
            await new Promise((r) => setTimeout(r, 8000));
          } else {
            console.log('[Agentia] QR no enviado al API:', res.status, lastError ? `- ${lastError}` : '');
            console.log('[Agentia] Abre en tu celular para ver el QR:', `${API_URL}/api/whatsapp/qr`);
          }
        } catch (e) {
          lastError = e.message || String(e);
          if (attempt < 3) {
            console.log('[Agentia] No se pudo enviar QR al API:', lastError, '- reintento en 8s...');
            await new Promise((r) => setTimeout(r, 8000));
          } else {
            console.log('[Agentia] No se pudo enviar QR al API:', lastError);
            console.log('[Agentia] Abre en tu celular para ver el QR:', `${API_URL}/api/whatsapp/qr`);
          }
        }
      }
    });

    nextClient.on('ready', () => {
      lastState = 'ready';
      reconnectAttempt = 0;
      whatsappReady = true;
      console.log('[Agentia] WhatsApp conectado correctamente.');
    });

    nextClient.on('authenticated', () => {
      lastState = 'authenticated';
      console.log('[Agentia] Autenticado.');
    });

    nextClient.on('auth_failure', (msg) => {
      lastState = 'auth_failure';
      whatsappReady = false;
      console.error('[Agentia] Error de autenticación:', msg);
      // En auth_failure normalmente se requiere borrar sesión y re-escanear
    });

    nextClient.on('disconnected', (reason) => {
      lastState = 'disconnected';
      whatsappReady = false;
      console.warn('[Agentia] WhatsApp desconectado:', reason);
      const delay = Math.min(30_000, 3_000 * Math.max(1, reconnectAttempt + 1));
      reconnectAttempt += 1;
      console.log(`[Agentia] Reintentando conexión en ${Math.round(delay / 1000)}s...`);
      setTimeout(() => {
        try {
          initClient();
        } catch (e) {
          console.error('[Agentia] Error reintentando init:', e?.message || String(e));
        }
      }, delay);
    });

  async function pollAndSendAlerts() {
    const alertNumber = getEnv('ALERT_WHATSAPP_NUMBER', '') || process.env.ALERT_WHATSAPP_NUMBER;
    if (!alertNumber) return;
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const res = await fetch(`${API_URL}/api/alerts/pending`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      const alerts = data.alerts || [];
      const sentIds = [];
      for (const a of alerts) {
        try {
          const chatId = alertNumber.includes('@') ? alertNumber : `${alertNumber.replace(/\D/g, '')}@c.us`;
          const isSaleClosed = a.reason === 'sale_closed';
          const isDocsConfirmed = a.reason === 'documents_confirmed';
          const title = isDocsConfirmed ? '📋 *CAPTURAR EN IZZI*' : isSaleClosed ? '💰 *Venta cerrada - Capturar*' : '🚨 *Lead urgente*';
          const senderLine = a.senderId ? `📱 ${a.senderId}` : '';
          const body = isDocsConfirmed ? (a.lastMessage || '') : `"${(a.lastMessage || '').slice(0, 200)}${(a.lastMessage || '').length > 200 ? '...' : ''}"`;
          const msg = `${title}\n${a.senderName || 'Sin nombre'} (${a.clientId})\n${senderLine}\n\n${body}\n\nVer: ${API_URL}/dashboard/leads`;
          await client.sendMessage(chatId, msg);
          sentIds.push(a.id);
          console.log(`[Agentia] Alerta enviada a ${alertNumber}`);
        } catch (e) {
          console.error('[Agentia] Error enviando alerta:', e.message);
        }
      }
      if (sentIds.length > 0) {
        const secret2 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
        await fetch(`${API_URL}/api/alerts/sent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret2 ? { Authorization: `Bearer ${secret2}` } : {}),
          },
          body: JSON.stringify({ ids: sentIds }),
        });
      }
    } catch (e) {
      console.error('[Agentia] Error en poll alerts:', e.message);
    }
  }

  async function pollAndSendReminders() {
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const res = await fetch(`${API_URL}/api/reminders/pending`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      const reminders = data.reminders || [];
      const sentIds = [];
      for (const r of reminders) {
        try {
          const chatId = r.senderId.includes('@') ? r.senderId : `${r.senderId}@c.us`;
          await client.sendMessage(chatId, r.message);
          sentIds.push(r._id);
          console.log(`[Agentia] Recordatorio enviado a ${r.senderId}`);
        } catch (e) {
          console.error('[Agentia] Error enviando recordatorio:', e.message);
        }
      }
      if (sentIds.length > 0) {
        const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
        await fetch(`${API_URL}/api/reminders/sent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
          },
          body: JSON.stringify({ ids: sentIds }),
        });
      }
    } catch (e) {
      console.error('[Agentia] Error en poll reminders:', e.message);
    }
  }

  async function pollAndSendOutboundMessages() {
    try {
      if (!client.info) return;
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const res = await fetch(`${API_URL}/api/chat/outbound`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      const items = data.messages || [];
      for (const m of items) {
        try {
          const raw = (m.senderId && typeof m.senderId === 'string') ? m.senderId.trim() : '';
          const chatId = raw.includes('@') ? raw : `${raw.replace(/\D/g, '')}@c.us`;
          if (!chatId || chatId === '@c.us' || chatId.length < 15) continue;
          if (typeof client.sendMessage !== 'function') break;
          await client.sendMessage(chatId, m.message);
          const secret2 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
          await fetch(`${API_URL}/api/chat/outbound`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(secret2 ? { Authorization: `Bearer ${secret2}` } : {}),
            },
            body: JSON.stringify({ id: m._id }),
          });
          console.log('[Agentia] Mensaje CRM enviado a', m.senderId);
        } catch (e) {
          console.error('[Agentia] Error enviando mensaje CRM:', e.message, 'id=', m._id, 'senderId=', m.senderId);
        }
      }
    } catch (e) {
      console.error('[Agentia] Error poll outbound:', e.message);
    }
  }

  setInterval(pollAndSendReminders, 60 * 1000);
  setTimeout(pollAndSendReminders, 30 * 1000);
  setInterval(pollAndSendAlerts, 60 * 1000);
  setTimeout(pollAndSendAlerts, 45 * 1000);
  setInterval(pollAndSendOutboundMessages, 5 * 1000);
  setTimeout(pollAndSendOutboundMessages, 3 * 1000);

  // Cola por remitente: evita race condition cuando envían 2+ imágenes seguidas (frente/reverso INE)
  const senderQueue = new Map();

  function enqueueAndProcess(senderId, fn) {
    const prev = senderQueue.get(senderId) || Promise.resolve();
    const next = prev.then(() => fn()).catch((e) => {
      console.error('[Agentia] Error en cola:', e.message);
    });
    senderQueue.set(senderId, next);
    next.finally(() => {
      if (senderQueue.get(senderId) === next) senderQueue.delete(senderId);
    });
    return next;
  }

  client.on('message', async (msg) => {
    if (msg.fromMe) return;
    if (msg.from === 'status@broadcast' || msg.isStatus || (msg.id && msg.id.remote === 'status@broadcast')) return;

    let chat;
    try {
      chat = await msg.getChat();
    } catch (e) {
      console.error('[Agentia] Error obteniendo chat:', e?.message || String(e));
      return;
    }
    if (chat && chat.isGroup) return;

    const contact = await msg.getContact();
    const body = msg.body?.trim() || '';
    const senderId = msg.from;
    const senderName = contact.pushname || contact.name || undefined;

    if (!body && !msg.hasMedia) return;

    let mediaBase64 = null;
    let mimeType = null;
    if (msg.hasMedia) {
      try {
        const media = await msg.downloadMedia();
        if (media && media.data) {
          mediaBase64 = media.data;
          mimeType = media.mimetype || 'image/jpeg';
          console.log(`[Agentia] Media recibido: ${mimeType}, ${mediaBase64.length} chars base64`);
        }
      } catch (e) {
        console.error('[Agentia] Error descargando media:', e.message);
      }
    }

    const displayMsg = body || (msg.hasMedia ? '[imagen/documento]' : '');
    console.log(`[Agentia] Mensaje de ${senderName || senderId}: ${displayMsg.slice(0, 50)}...`);

    const processMessage = async () => {
      const { reply, mediaUrl } = await callChatApi(body || '[imagen adjunta]', senderId, senderName, mediaBase64, mimeType);
      return { reply, mediaUrl };
    };

    try {
      const { reply, mediaUrl, botPaused } = msg.hasMedia
        ? await enqueueAndProcess(senderId, processMessage)
        : await processMessage();
      if (botPaused) {
        // Kill switch activo: no responder absolutamente nada
      } else if (reply || mediaUrl) {
        if (mediaUrl) {
          try {
            const res = await fetch(mediaUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = await res.arrayBuffer();
            const base64 = Buffer.from(buf).toString('base64');
            const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
            const media = new MessageMedia(mime, base64);
            const chatId = msg.from;
            const opts = reply ? { caption: reply } : {};
            await client.sendMessage(chatId, media, opts);
            console.log('[Agentia] Respuesta con imagen enviada.');
          } catch (e) {
            console.error('[Agentia] Error enviando imagen:', e);
            console.error('[Agentia] Stack:', e instanceof Error ? e.stack : '(no stack)');
            if (reply) await msg.reply(reply);
          }
        } else if (reply) {
          await msg.reply(reply);
          console.log('[Agentia] Respuesta enviada.');
        }
      } else {
        console.log('[Agentia] API devolvió respuesta vacía.');
        await msg.reply('Un momento, por favor. 🔄');
      }
    } catch (err) {
      console.error('[Agentia] Error:', err.message);
      await msg.reply('Lo siento, hubo un error. Por favor intenta más tarde.');
    }
  });

    nextClient.initialize().catch((err) => {
      lastState = 'init_error';
      whatsappReady = false;
      console.error('[Agentia] Error al inicializar:', err);
      const delay = Math.min(30_000, 3_000 * Math.max(1, reconnectAttempt + 1));
      reconnectAttempt += 1;
      setTimeout(() => initClient(), delay);
    });
  }

  initClient();
}

main();
