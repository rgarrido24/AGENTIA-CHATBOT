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
const qrcode = require('qrcode');
const http = require('http');
const { execFile } = require('child_process');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function execFileAsync(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts || {}, (err, stdout, stderr) => {
      if (err) reject(Object.assign(err, { stdout, stderr }));
      else resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}

function isBrowserAlreadyRunningError(err) {
  const msg = (err && (err.message || String(err))) || '';
  return /browser is already running/i.test(msg) && /Use a different `userDataDir`/i.test(msg);
}

async function killOrphanChromeUsingProfile(profilePath) {
  // En Render (Linux), a veces queda un Chrome huérfano tras restart; bloquea el userDataDir.
  // Estrategia: listar procesos y matar los que tengan el profilePath en args.
  try {
    const { stdout } = await execFileAsync('ps', ['-eo', 'pid,args'], { timeout: 8000 });
    const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const pids = [];
    for (const line of lines) {
      const m = line.match(/^(\d+)\s+(.*)$/);
      if (!m) continue;
      const pid = Number(m[1]);
      const args = m[2] || '';
      if (!pid || pid === process.pid) continue;
      if (!args.toLowerCase().includes('chrome') && !args.toLowerCase().includes('chrom')) continue;
      if (args.includes(profilePath)) pids.push(pid);
    }
    if (pids.length === 0) return false;
    for (const pid of pids) {
      try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
    }
    console.warn(`[Agentia] Chrome huérfano matado para perfil: ${profilePath} (pids: ${pids.join(',')})`);
    await sleep(1500);
    return true;
  } catch (e) {
    console.warn('[Agentia] No se pudo limpiar Chrome huérfano:', e?.message || String(e));
    return false;
  }
}

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
const CLIENT_IDS = String(
  getEnv('AGENTIA_WHATSAPP_CLIENT_IDS', '') || process.env.AGENTIA_WHATSAPP_CLIENT_IDS || ''
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const CLIENT_ID = getEnv('AGENTIA_WHATSAPP_CLIENT_ID', 'agentia').trim().toLowerCase();
const ACTIVE_CLIENT_IDS = (CLIENT_IDS.length > 0 ? CLIENT_IDS : [CLIENT_ID])
  .filter(Boolean);
const PAGE_ID = 'whatsapp-bridge';

// Seguridad: por defecto NO enviar mensajes automáticos a leads.
// Solo se deben habilitar explícitamente en el worker (Render) si el negocio lo requiere.
function isEnabled(envKey, defaultValue = false) {
  const raw = String(getEnv(envKey, '') || '').trim().toLowerCase();
  if (!raw) return defaultValue;
  if (['1', 'true', 'yes', 'y', 'on', 'enable', 'enabled'].includes(raw)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'disable', 'disabled'].includes(raw)) return false;
  return defaultValue;
}

const ENABLE_ALERTS = isEnabled('AGENTIA_ENABLE_ALERTS', true);
const ENABLE_OUTBOUND_MESSAGES = isEnabled('AGENTIA_ENABLE_OUTBOUND_MESSAGES', false);
const ENABLE_REMINDERS = isEnabled('AGENTIA_ENABLE_REMINDERS', false);
const ENABLE_REACTIVATION = isEnabled('AGENTIA_ENABLE_REACTIVATION', false);
const ENABLE_CONFIRMATIONS = isEnabled('AGENTIA_ENABLE_CONFIRMATIONS', false);
const ENABLE_REVIEWS = isEnabled('AGENTIA_ENABLE_REVIEWS', false);
const ENABLE_AGENTIA_FOLLOWUP = isEnabled('AGENTIA_ENABLE_AGENTIA_FOLLOWUP', false);

function getApiBase() {
  // Si el worker tiene CHATBOT_WEBHOOK_URL pero AGENTIA_CHATBOT_API_URL está mal,
  // el inbound puede funcionar mientras outbound falla. Derivamos el origin del webhook.
  const webhookUrl = (getEnv('CHATBOT_WEBHOOK_URL', '') || '').trim();
  if (webhookUrl) {
    try {
      return new URL(webhookUrl).origin.replace(/\/$/, '');
    } catch { /* ignore */ }
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
  // Si llega como número nacional (sin país), asumimos AR (la operación actual es AR-only).
  // Ej: 351xxxxxxx o 11xxxxxxxxx → 54 + (móvil: 9) + ...
  if (!digits.startsWith('54') && (digits.length === 10 || digits.length === 11)) {
    digits = `54${digits}`;
  }
  // WhatsApp (Argentina): para móviles suele requerir 54 + 9 + área + número.
  // Muchos leads llegan como 54 + área + número (sin 9), lo que puede fallar con "No LID for user".
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length >= 11) {
    return `549${digits.slice(2)}`;
  }
  return digits;
}

async function callChatApi(clientId, message, senderId, senderName, mediaBase64, mimeType) {
  const webhookUrl = (getEnv('CHATBOT_WEBHOOK_URL', '') || `${getApiBase()}/api/webhook/whatsapp`).replace(/\/$/, '');
  const url = webhookUrl;
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json.error || `HTTP ${res.status}`;
    console.error('[Agentia] API error:', res.status, json);
    // No tumbar el bridge por un tenant sin config o error temporal.
    // Devolvemos una respuesta segura (vacía) y dejamos que el caller maneje.
    return { reply: '', mediaUrl: null, botPaused: false, error: errMsg, status: res.status };
  }
  const reply = typeof json.mensaje === 'string' ? json.mensaje : (typeof json.reply === 'string' ? json.reply : '');
  return { reply: String(reply || '').trim(), mediaUrl: json.mediaUrl || null, botPaused: !!json.botPaused };
}

async function main() {
  console.log('[Agentia] WhatsApp Puente iniciando...');
  console.log('[Agentia] API URL:', API_URL);
  console.log('[Agentia] Clients:', ACTIVE_CLIENT_IDS.join(', ') || '(none)');
  console.log('');

  // Estado por clientId
  const clients = new Map(); // clientId -> { client, ready, state, reconnectAttempt, initInFlight, lastInitAt }
  const lastQrByClient = new Map(); // clientId -> { qr, dataUrl }

  const bridgePort = Number(getEnv('PORT', process.env.PORT || '10000')) || 10000;
  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    if (req.url.startsWith('/health')) {
      const all = ACTIVE_CLIENT_IDS.map((id) => {
        const st = clients.get(id);
        return {
          clientId: id,
          ready: !!st?.ready,
          state: st?.state || 'boot',
          hasQr: !!lastQrByClient.get(id)?.qr,
        };
      });
      const ok = all.some((c) => c.ready);
      const body = JSON.stringify({
        ok,
        clients: all,
        timestamp: new Date().toISOString(),
      });
      res.statusCode = ok ? 200 : 503;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(body);
      return;
    }
    if (req.url.startsWith('/qr')) {
      const url = new URL(req.url, 'http://localhost');
      const clientId = (url.searchParams.get('clientId') || ACTIVE_CLIENT_IDS[0] || 'agentia').trim().toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const qr = lastQrByClient.get(clientId)?.dataUrl || null;
      if (!qr) {
        res.end('<html><body style="background:#000;color:#fff;padding:24px">Esperando QR... recarga en 10 segundos</body></html>');
        return;
      }
      res.end('<html><body style="background:#000"><img src="' + qr + '" style="width:300px"/></body></html>');
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  });
  server.listen(bridgePort, () => {
    console.log(`[Agentia] Bridge /health escuchando en :${bridgePort}`);
  });

  // ─── Funciones de polling (definidas en main() para que setInterval las vea) ───

  function getClientState(id) {
    return clients.get(String(id || '').trim().toLowerCase());
  }

  function getAnyReadyClient() {
    for (const id of ACTIVE_CLIENT_IDS) {
      const st = getClientState(id);
      if (st?.ready && st?.client) return st.client;
    }
    return null;
  }

  function getReadyClientForClientId(id) {
    const st = getClientState(id);
    if (st?.ready && st?.client) return st.client;
    return getAnyReadyClient();
  }

  /** Solo el bridge del clientId pedido — sin “prestar” otro número (evita envíos cruzados). */
  function getStrictReadyClientForClientId(id) {
    const normalized = String(id || '').trim().toLowerCase();
    if (!normalized) return null;
    const st = getClientState(normalized);
    return st?.ready && st?.client ? st.client : null;
  }

  async function pollAndSendAlerts() {
    if (!ENABLE_ALERTS) return;
    // Alertas: SIEMPRE deben salir del número correcto (no “prestar” otro clientId).
    // Por defecto, usamos agentia-ventas (operación con Luciano).
    const alertSenderClientId =
      String(getEnv('AGENTIA_ALERTS_SENDER_CLIENT_ID', '') || process.env.AGENTIA_ALERTS_SENDER_CLIENT_ID || 'agentia-ventas')
        .trim()
        .toLowerCase();
    const client = getStrictReadyClientForClientId(alertSenderClientId);
    if (!client) {
      // Importante: si el bridge está conectado pero no “ready”, aquí se vería.
      console.warn(`[Agentia] Alertas: bridge no listo para clientId='${alertSenderClientId}'`);
      return;
    }
    const alertNumber = getEnv('ALERT_WHATSAPP_NUMBER', '') || process.env.ALERT_WHATSAPP_NUMBER;
    if (!alertNumber) {
      console.warn('[Agentia] ALERT_WHATSAPP_NUMBER no configurado — alertas desactivadas.');
      return;
    }
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/alerts/pending`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[Agentia] Alertas: /api/alerts/pending fallo', res.status, body.slice(0, 300));
        return;
      }
      const data = await res.json().catch(() => ({}));
      const alerts = data.alerts || [];
      const sentIds = [];
      for (const a of alerts) {
        try {
          const normalized = normalizeWhatsappDigits(alertNumber);
          const chatId = alertNumber.includes('@') ? alertNumber : `${normalized}@c.us`;
          const senderLine = a.senderId ? `📱 ${a.senderId.replace(/@.*$/, '')}` : '';
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
          case 'high_activity':
            msg = `🔥 *LEAD MUY ACTIVO*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
            break;
          case 'decohouse_lead':
            msg = `🪟 *DECO HOUSE — Lead / cotización*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
            break;
          default:
              msg = `📣 *ALERTA – ${(a.reason || '').toUpperCase()}*\n👤 ${a.senderName || 'Sin nombre'}\n${senderLine}\n\n${a.lastMessage || ''}\n\n🔗 ${API_URL}/dashboard/leads`;
          }
          await client.sendMessage(chatId, msg);
          sentIds.push(a.id);
          console.log(`[Agentia] Alerta [${a.reason}] enviada a ${alertNumber}`);
        } catch (e) {
          console.error('[Agentia] Error enviando alerta:', e.message);
        }
      }
      if (sentIds.length > 0) {
        const secret2 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
        const sentRes = await fetch(`${apiBase}/api/alerts/sent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(secret2 ? { Authorization: `Bearer ${secret2}` } : {}) },
          body: JSON.stringify({ ids: sentIds }),
        });
        if (!sentRes.ok) {
          const body = await sentRes.text().catch(() => '');
          console.error('[Agentia] Alertas: /api/alerts/sent fallo', sentRes.status, body.slice(0, 300));
        }
      }
    } catch (e) {
      console.error('[Agentia] Error en poll alerts:', e.message);
    }
  }

  async function pollAndSendReminders() {
    if (!ENABLE_REMINDERS) return;
    const client = getAnyReadyClient();
    if (!client) return;
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const headers = { 'Content-Type': 'application/json', ...(secret ? { Authorization: `Bearer ${secret}` } : {}) };
      const apiBase = getApiBase();

      // 1. Generar recordatorios de seguimiento para leads sin respuesta 2h+
      await fetch(`${apiBase}/api/reminders/generate`, { method: 'POST', headers }).catch(() => {});

      // 2. Enviar los recordatorios pendientes
      const res = await fetch(`${apiBase}/api/reminders/pending`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      const reminders = data.reminders || [];
      const sentIds = [];
      for (const r of reminders) {
        try {
          const digits = normalizeWhatsappDigits(r.senderId || '');
          if (!digits || digits.length < 10) {
            console.warn('[Agentia] Recordatorio sin senderId válido, omitiendo:', r._id);
            sentIds.push(r._id); // marcar como enviado para no reintentar
            continue;
          }
          const chatId = r.senderId.includes('@') ? r.senderId : `${digits}@c.us`;
          await client.sendMessage(chatId, r.message);
          sentIds.push(r._id);
          console.log(`[Agentia] Recordatorio de seguimiento enviado a ${digits}`);
        } catch (e) {
          console.error('[Agentia] Error enviando recordatorio:', e.message);
        }
      }
      if (sentIds.length > 0) {
        await fetch(`${apiBase}/api/reminders/sent`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ids: sentIds }),
        });
      }
    } catch (e) {
      console.error('[Agentia] Error en poll reminders:', e.message);
    }
  }

  async function pollAndSendOutboundMessages() {
    if (!ENABLE_OUTBOUND_MESSAGES) return;
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/chat/outbound`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      const items = data.messages || [];
      for (const m of items) {
        try {
          const msgClientId = String(m.clientId || '').trim().toLowerCase();
          const src = String(m.source || '');
          // REGLA OPERATIVA: cada mensaje debe salir del bridge del `clientId` del mensaje.
          // Para alertas admin (FB/Zapier), el server debe setear clientId='agentia-ventas'
          // (o el que corresponda al número de Agentia). Nunca “prestar” otro bridge.
          const client = getStrictReadyClientForClientId(msgClientId);
          if (!client || !client.info) {
            const readyList = ACTIVE_CLIENT_IDS.filter((id) => getClientState(id)?.ready).join(', ') || 'ninguno';
            const why = !msgClientId
              ? `outbound sin clientId (definí clientId en el mensaje; bridges listos: ${readyList})`
              : `bridge no listo para clientId=${msgClientId} (source=${src}) — no se usa otro número (listos: ${readyList})`;
            const secret0 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
            await fetch(`${apiBase}/api/chat/outbound/error`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(secret0 ? { Authorization: `Bearer ${secret0}` } : {}) },
              body: JSON.stringify({ id: m._id, error: why }),
            }).catch(() => {});
            continue;
          }
          const raw = (m.senderId && typeof m.senderId === 'string') ? m.senderId.trim() : '';
          const digits = normalizeWhatsappDigits(raw);
          const chatId = raw.includes('@') ? raw : `${digits}@c.us`;
          if (!chatId || chatId === '@c.us' || chatId.length < 15) {
            const secretBad = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
            await fetch(`${apiBase}/api/chat/outbound/error`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(secretBad ? { Authorization: `Bearer ${secretBad}` } : {}) },
              body: JSON.stringify({
                id: m._id,
                error: `senderId inválido para @c.us: "${raw}" → ${chatId}`,
              }),
            }).catch(() => {});
            continue;
          }
          if (typeof client.sendMessage !== 'function') break;

          if (m.mediaUrl) {
            // Enviar con media (video/GIF/imagen) + texto como caption
            try {
              const media = await MessageMedia.fromUrl(m.mediaUrl, { unsafeMime: true });
              await client.sendMessage(chatId, media, { caption: m.message });
            } catch (mediaErr) {
              // Si falla el media, enviar solo texto
              console.warn('[Agentia] Media falló, enviando solo texto:', mediaErr.message);
              await client.sendMessage(chatId, m.message);
            }
          } else {
            await client.sendMessage(chatId, m.message);
          }

          const secret2 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
          await fetch(`${apiBase}/api/chat/outbound`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(secret2 ? { Authorization: `Bearer ${secret2}` } : {}) },
            body: JSON.stringify({ id: m._id }),
          });
          console.log('[Agentia] Outbound enviado a', m.senderId, m.mediaUrl ? '(con media)' : '');
        } catch (e) {
          const msg = e && e.message ? e.message : String(e);
          console.error('[Agentia] Error enviando outbound:', msg, 'id=', m._id, 'senderId=', m.senderId);
          try {
            const secret3 = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
            await fetch(`${apiBase}/api/chat/outbound/error`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(secret3 ? { Authorization: `Bearer ${secret3}` } : {}) },
              body: JSON.stringify({ id: m._id, error: msg }),
            });
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error('[Agentia] Error poll outbound:', e.message);
    }
  }

  // ─── Retención: Reactivación de inactivos (cada hora) ───────────
  async function pollAndSendReactivation() {
    if (!ENABLE_REACTIVATION) return;
    const featureClientId = ACTIVE_CLIENT_IDS[0] || 'agentia';
    const client = getReadyClientForClientId(featureClientId);
    if (!client) return;
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const headers = {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      };
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/barber/reactivation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ clientId: featureClientId, daysThreshold: 20 }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.enqueued > 0) {
        console.log(`[Agentia] Reactivación: ${data.enqueued} mensajes encolados`);
      }
    } catch (e) {
      console.error('[Agentia] Error poll reactivation:', e.message);
    }
  }

  // ─── Retención: Confirmaciones anti no-show (cada 10 min) ───────
  async function pollAndSendConfirmations() {
    if (!ENABLE_CONFIRMATIONS) return;
    const featureClientId = ACTIVE_CLIENT_IDS[0] || 'agentia';
    const client = getReadyClientForClientId(featureClientId);
    if (!client) return;
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const headers = {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      };
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/barber/confirmations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (data.enqueued > 0) {
        console.log(`[Agentia] Confirmaciones: ${data.enqueued} mensajes encolados`);
      }
    } catch (e) {
      console.error('[Agentia] Error poll confirmations:', e.message);
    }
  }

  // ─── Agentia Ventas: Follow-up automático de prospectos (solo agentia-ventas) ───
  async function pollAndSendAgentiaFollowup() {
    if (!ENABLE_AGENTIA_FOLLOWUP) return;
    const client = getReadyClientForClientId('agentia-ventas');
    if (!client) return;
    if (!ACTIVE_CLIENT_IDS.includes('agentia-ventas')) return;
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const headers = {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      };
      const apiBase = getApiBase();

      // 1. Generar nuevos follow-ups pendientes
      await fetch(`${apiBase}/api/agentia/followup`, { method: 'POST', headers, body: '{}' }).catch(() => {});

      // 2. Detectar prospectos que respondieron con interés
      await fetch(`${apiBase}/api/agentia/followup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ detectInterest: true }),
      }).catch(() => {});

      // 3. Obtener mensajes pendientes de envío
      const res = await fetch(`${apiBase}/api/agentia/followup`, { headers });
      const data = await res.json().catch(() => ({}));
      const messages = data.messages || [];

      const sentIds = [];
      for (const m of messages) {
        try {
          const digits = (m.senderId || '').replace(/\D/g, '');
          if (!digits || digits.length < 10) {
            sentIds.push(String(m._id));
            continue;
          }
          const chatId = m.senderId.includes('@') ? m.senderId : `${digits}@c.us`;
          await client.sendMessage(chatId, m.message);
          sentIds.push(String(m._id));
          console.log(`[Agentia] Follow-up #${m.followupNumber} enviado a ${digits}`);
        } catch (e) {
          console.error('[Agentia] Error enviando follow-up:', e.message);
        }
      }

      // 4. Marcar como enviados
      if (sentIds.length > 0) {
        await fetch(`${apiBase}/api/agentia/followup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ sentIds }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('[Agentia] Error poll followup:', e.message);
    }
  }

  // ─── Retención: Solicitudes de reseña (cada 15 min) ─────────────
  async function pollAndSendReviews() {
    if (!ENABLE_REVIEWS) return;
    const featureClientId = ACTIVE_CLIENT_IDS[0] || 'agentia';
    const client = getReadyClientForClientId(featureClientId);
    if (!client) return;
    try {
      const reviewUrl = getEnv('GOOGLE_MAPS_REVIEW_URL', '') || process.env.GOOGLE_MAPS_REVIEW_URL || '';
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const headers = {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      };
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/barber/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ clientId: featureClientId, reviewUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.enqueued > 0) {
        console.log(`[Agentia] Reseñas: ${data.enqueued} mensajes encolados`);
      }
    } catch (e) {
      console.error('[Agentia] Error poll reviews:', e.message);
    }
  }

  // ─── Billing: suspender clientes vencidos (día 6 de cada mes) ──
  async function pollAndCheckPayments() {
    const today = new Date();
    if (today.getDate() !== 6) return; // only run on the 6th
    try {
      const secret = getEnv('CRON_SECRET', '') || process.env.CRON_SECRET;
      const res = await fetch(`${API_URL}/api/billing/check-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (data.suspended > 0) {
        console.log(`[Agentia] Billing: ${data.suspended} cliente(s) suspendido(s):`, data.clients);
      }
    } catch (e) {
      console.error('[Agentia] Error poll billing:', e.message);
    }
  }

  // ────────────────────────────────────────────────────────────────

  // Cola por remitente: evita race condition cuando envían 2+ imágenes seguidas (frente/reverso INE)
  const senderQueue = new Map(); // key = `${clientId}:${senderId}`

  function enqueueAndProcess(key, fn) {
    const prev = senderQueue.get(key) || Promise.resolve();
    const next = prev.then(() => fn()).catch((e) => {
      console.error('[Agentia] Error en cola:', e?.message || String(e));
    });
    senderQueue.set(key, next);
    next.finally(() => {
      if (senderQueue.get(key) === next) senderQueue.delete(key);
    });
    return next;
  }

  function initClientFor(clientId) {
    const id = String(clientId || '').trim().toLowerCase() || 'agentia';
    const apiBase = getApiBase();
    const sessionDir = path.join(__dirname, '..', `.wwebjs_auth_${id}`);
    const profileDir = path.join(sessionDir, 'session');

    const state = clients.get(id) || { client: null, ready: false, state: 'boot', reconnectAttempt: 0, initInFlight: false, lastInitAt: 0 };
    // Evita iniciar 2 veces el mismo clientId en paralelo (causa: loops + reintentos).
    if (state.initInFlight) {
      const since = Date.now() - (state.lastInitAt || 0);
      if (since < 60_000) {
        console.warn(`[Agentia] (${id}) init ya en curso (hace ${Math.round(since / 1000)}s) — omitido`);
        clients.set(id, state);
        return;
      }
      // Si quedó “clavado” más de 60s, permitimos reintento.
      console.warn(`[Agentia] (${id}) init parecía clavado — reintentando`);
    }
    state.state = 'initializing';
    state.ready = false;
    state.initInFlight = true;
    state.lastInitAt = Date.now();

    // Si existe un cliente previo, intentamos destruirlo para no dejar Chromium vivo.
    try {
      if (state.client && typeof state.client.destroy === 'function') {
        state.client.destroy().catch?.(() => {});
      }
    } catch { /* ignore */ }

    const nextClient = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionDir }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    });
    state.client = nextClient;
    clients.set(id, state);

    nextClient.on('qr', async (qr) => {
      state.state = 'qr';
      let dataUrl = null;
      try { dataUrl = await qrcode.toDataURL(qr); } catch { dataUrl = null; }
      lastQrByClient.set(id, { qr, dataUrl });
      console.log(`\n[Agentia] (${id}) QR recibido — escanea desde: ${apiBase}/api/whatsapp/qr?clientId=${encodeURIComponent(id)}\n`);

      const qrSecret = getEnv('WHATSAPP_QR_SECRET', '') || process.env.WHATSAPP_QR_SECRET;
      const url = `${apiBase}/api/whatsapp/qr-store`;
      const payload = JSON.stringify({ qr, clientId: id });
      const headers = { 'Content-Type': 'application/json', ...(qrSecret ? { Authorization: `Bearer ${qrSecret}` } : {}) };
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const r = await fetch(url, { method: 'POST', headers, body: payload });
          if (r.ok) break;
        } catch { /* ignore */ }
        if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
      }
    });

    nextClient.on('ready', () => {
      state.state = 'ready';
      state.reconnectAttempt = 0;
      state.ready = true;
      state.initInFlight = false;
      console.log(`[Agentia] (${id}) WhatsApp conectado correctamente.`);
      const qrSecret = getEnv('WHATSAPP_QR_SECRET', '') || process.env.WHATSAPP_QR_SECRET;
      fetch(`${apiBase}/api/whatsapp/qr-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(qrSecret ? { Authorization: `Bearer ${qrSecret}` } : {}) },
        body: JSON.stringify({ clientId: id, connected: true }),
      }).catch(() => {});
      lastQrByClient.set(id, { qr: null, dataUrl: null });
    });

    nextClient.on('authenticated', () => {
      state.state = 'authenticated';
      console.log(`[Agentia] (${id}) Autenticado.`);
    });

    nextClient.on('auth_failure', (msg) => {
      state.state = 'auth_failure';
      state.ready = false;
      state.initInFlight = false;
      console.error(`[Agentia] (${id}) Error de autenticación:`, msg);
    });

    nextClient.on('disconnected', (reason) => {
      state.state = 'disconnected';
      state.ready = false;
      state.initInFlight = false;
      console.warn(`[Agentia] (${id}) WhatsApp desconectado:`, reason);
      const qrSecret = getEnv('WHATSAPP_QR_SECRET', '') || process.env.WHATSAPP_QR_SECRET;
      fetch(`${apiBase}/api/whatsapp/qr-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(qrSecret ? { Authorization: `Bearer ${qrSecret}` } : {}) },
        body: JSON.stringify({ clientId: id, connected: false }),
      }).catch(() => {});
      const delay = Math.min(30_000, 3_000 * Math.max(1, state.reconnectAttempt + 1));
      state.reconnectAttempt += 1;
      console.log(`[Agentia] (${id}) Reintentando conexión en ${Math.round(delay / 1000)}s...`);
      setTimeout(() => initClientFor(id), delay);
    });

    nextClient.on('message', async (msg) => {
      if (msg.fromMe) return;
      if (msg.from === 'status@broadcast' || msg.isStatus || (msg.id && msg.id.remote === 'status@broadcast')) return;
      let chat;
      try { chat = await msg.getChat(); } catch { return; }
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
          }
        } catch { /* ignore */ }
      }

      const key = `${id}:${senderId}`;
      const processMessage = async () => {
        const { reply, mediaUrl, botPaused } = await callChatApi(id, body || '[imagen adjunta]', senderId, senderName, mediaBase64, mimeType);
        return { reply, mediaUrl, botPaused };
      };

      try {
        const { reply, mediaUrl, botPaused } = msg.hasMedia
          ? await enqueueAndProcess(key, processMessage)
          : await processMessage();
        if (botPaused) return;

        if (mediaUrl) {
          try {
            const r = await fetch(mediaUrl);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const buf = await r.arrayBuffer();
            const base64 = Buffer.from(buf).toString('base64');
            const mime = (r.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
            const media = new MessageMedia(mime, base64);
            const opts = reply ? { caption: reply } : {};
            await nextClient.sendMessage(msg.from, media, opts);
          } catch {
            if (reply) await msg.reply(reply);
          }
          return;
        }

        if (reply) {
          await msg.reply(reply);
          return;
        }

        await msg.reply('Un momento, por favor. 🔄');
      } catch (err) {
        console.error('[Agentia] Error:', err?.message || String(err));
        await msg.reply('Lo siento, hubo un error. Por favor intenta más tarde.');
      }
    });

    nextClient.initialize().catch((err) => {
      state.state = 'init_error';
      state.ready = false;
      state.initInFlight = false;
      console.error(`[Agentia] (${id}) Error al inicializar:`, err);
      // Caso común en Render: restart deja un Chrome vivo con el mismo perfil.
      // Intentamos limpiar y reintentar una vez rápido para evitar loops eternos.
      (async () => {
        if (isBrowserAlreadyRunningError(err)) {
          const cleaned = await killOrphanChromeUsingProfile(profileDir);
          if (cleaned) {
            console.log(`[Agentia] (${id}) Reintentando inicialización tras limpiar Chrome...`);
            await sleep(1000);
            return initClientFor(id);
          }
        }
        // TargetCloseError suele pasar cuando Chromium se cae por recursos; esperamos un poco más.
        const msg = (err && (err.message || String(err))) || '';
        const extra = /TargetCloseError|Target closed|Protocol error/i.test(msg) ? 15_000 : 0;
        const delay = Math.min(30_000, 3_000 * Math.max(1, state.reconnectAttempt + 1));
        state.reconnectAttempt += 1;
        setTimeout(() => initClientFor(id), delay + extra);
      })().catch(() => {});
    });
  }

  for (const id of ACTIVE_CLIENT_IDS) initClientFor(id);

  // Registrar intervalos UNA SOLA VEZ — fuera de initClient para evitar duplicados en cada reconexión
  if (ENABLE_ALERTS) {
    setTimeout(pollAndSendAlerts, 15 * 1000);
    setInterval(pollAndSendAlerts, 20 * 1000);
  } else {
    console.warn('[Agentia] ALERTS deshabilitadas por env AGENTIA_ENABLE_ALERTS');
  }

  // Recordatorios: primera ejecución a los 5 min (da tiempo al bridge de conectarse),
  // luego cada 30 min (ventana de detección es 2h, no necesita revisión más frecuente)
  if (ENABLE_REMINDERS) {
    setTimeout(pollAndSendReminders, 5 * 60 * 1000);
    setInterval(pollAndSendReminders, 30 * 60 * 1000);
  }

  if (ENABLE_OUTBOUND_MESSAGES) {
    setTimeout(pollAndSendOutboundMessages, 3 * 1000);
    setInterval(pollAndSendOutboundMessages, 5 * 1000);
  } else {
    console.warn('[Agentia] OUTBOUND a leads deshabilitado (AGENTIA_ENABLE_OUTBOUND_MESSAGES=false)');
  }

  // Retención: primera ejecución con retraso para que el bridge se establezca
  if (ENABLE_REACTIVATION) {
    setTimeout(pollAndSendReactivation, 10 * 60 * 1000);
    setInterval(pollAndSendReactivation, 60 * 60 * 1000);
  }

  if (ENABLE_CONFIRMATIONS) {
    setTimeout(pollAndSendConfirmations, 2 * 60 * 1000);
    setInterval(pollAndSendConfirmations, 10 * 60 * 1000);
  }

  if (ENABLE_REVIEWS) {
    setTimeout(pollAndSendReviews, 3 * 60 * 1000);
    setInterval(pollAndSendReviews, 15 * 60 * 1000);
  }

  // Follow-up de prospectos Agentia Ventas: solo cuando existe ese clientId en este worker
  if (ENABLE_AGENTIA_FOLLOWUP && ACTIVE_CLIENT_IDS.includes('agentia-ventas')) {
    setTimeout(pollAndSendAgentiaFollowup, 10 * 60 * 1000);        // primera ejecución a los 10 min
    setInterval(pollAndSendAgentiaFollowup, 6 * 60 * 60 * 1000);   // cada 6 horas
  }

  // Billing check: runs every 12 hours but only acts on day 6 of the month
  setTimeout(pollAndCheckPayments, 30 * 60 * 1000);
  setInterval(pollAndCheckPayments, 12 * 60 * 60 * 1000);
}

main();
