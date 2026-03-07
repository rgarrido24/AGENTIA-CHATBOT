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

function getEnv(key, def) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    const re = new RegExp(`^${key}=(.+)$`, 'm');
    const m = text.match(re);
    if (m) {
      let v = m[1].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return v || def;
    }
  }
  return process.env[key] || def;
}

const API_URL = (getEnv('AGENTIA_CHATBOT_API_URL', '') || 'http://localhost:3010').replace(/\/$/, '');
const CLIENT_ID = getEnv('AGENTIA_WHATSAPP_CLIENT_ID', 'agentia').trim().toLowerCase();
const PAGE_ID = 'whatsapp-bridge';

async function callChatApi(message, senderId, senderName, mediaBase64, mimeType) {
  const url = `${API_URL}/api/chat`;
  const payload = {
    clientId: CLIENT_ID,
    platform: 'whatsapp',
    entryType: 'dm',
    message: message || '[imagen/documento adjunto]',
    senderId,
    senderName: senderName || undefined,
    pageId: PAGE_ID,
  };
  if (mediaBase64 && mimeType) {
    payload.mediaBase64 = mediaBase64;
    payload.mimeType = mimeType;
  }
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
  const mediaUrl = typeof json.mediaUrl === 'string' && json.mediaUrl.trim() ? json.mediaUrl.trim() : null;
  if (mediaUrl) console.log('[Agentia] API devolvió mediaUrl:', mediaUrl);
  const botPaused = json.botPaused === true;
  if (botPaused) console.log('[Agentia] Bot pausado - no se envía respuesta.');
  return { reply: String(json.reply || '').trim(), mediaUrl, botPaused };
}

async function main() {
  console.log('[Agentia] WhatsApp Puente iniciando...');
  console.log('[Agentia] API URL:', API_URL);
  console.log('[Agentia] ClientId:', CLIENT_ID);
  console.log('[Agentia] Sesión:', `.wwebjs_auth_${CLIENT_ID}`);
  console.log('');

  // Carpeta de sesión por cliente (evita conflicto con navegador bloqueado)
  const sessionDir = path.join(__dirname, '..', `.wwebjs_auth_${CLIENT_ID}`);
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionDir }),
    puppeteer: { headless: true, args: ['--no-sandbox'] },
  });

  client.on('qr', async (qr) => {
    console.log('\n[Agentia] Escanea el QR con WhatsApp:\n');
    qrcode.generate(qr, { small: true });

    // Envía el QR al API para que /api/whatsapp/qr lo sirva (vincular desde dashboard.agentia.io)
    const qrSecret = getEnv('WHATSAPP_QR_SECRET', '') || process.env.WHATSAPP_QR_SECRET;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/qr-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(qrSecret ? { Authorization: `Bearer ${qrSecret}` } : {}),
        },
        body: JSON.stringify({ qr }),
      });
      if (res.ok) console.log('[Agentia] QR enviado al API para vincular desde la web.');
      else console.log('[Agentia] QR no enviado al API:', res.status);
    } catch (e) {
      console.log('[Agentia] No se pudo enviar QR al API:', e.message);
    }
  });

  client.on('ready', () => {
    console.log('[Agentia] WhatsApp conectado correctamente.');
  });

  client.on('authenticated', () => {
    console.log('[Agentia] Autenticado.');
  });

  client.on('auth_failure', (msg) => {
    console.error('[Agentia] Error de autenticación:', msg);
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
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const res = await fetch(`${API_URL}/api/chat/outbound`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      const items = data.messages || [];
      for (const m of items) {
        try {
          const chatId = m.senderId && m.senderId.includes('@') ? m.senderId : `${(m.senderId || '').replace(/\D/g, '')}@c.us`;
          if (!chatId || chatId === '@c.us') continue;
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
          console.error('[Agentia] Error enviando mensaje CRM:', e.message);
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

    const chat = await msg.getChat();
    if (chat.isGroup) return;

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

  client.initialize().catch((err) => {
    console.error('[Agentia] Error al inicializar:', err);
    process.exit(1);
  });
}

main();
