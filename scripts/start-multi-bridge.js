/**
 * start-multi-bridge.js
 *
 * Corre dos bridges de WhatsApp (izzi + agentia-ventas) como procesos hijo
 * dentro de un solo Background Worker en Render.
 *
 * Cada bridge corre en su propio puerto interno (no expuesto al exterior):
 *   izzi          → :10001
 *   agentia-ventas → :10002
 *
 * Este proceso padre expone un /health combinado en :10000 (puerto del worker).
 *
 * Uso:
 *   node scripts/start-multi-bridge.js
 *
 * Variables de entorno requeridas en Render:
 *   AGENTIA_CHATBOT_API_URL   (ej: https://agentia.software)
 *   WHATSAPP_QR_SECRET
 *   MONGODB_URI
 *   CRON_SECRET
 *   ALERT_WHATSAPP_NUMBER
 */

'use strict';

const { spawn } = require('child_process');
const path      = require('path');
const http      = require('http');

const BRIDGE_SCRIPT = path.join(__dirname, 'whatsapp-bridge.js');

const BRIDGES = [
  { clientId: 'izzi',           port: 10001, label: 'IZZI   ' },
  { clientId: 'agentia-ventas', port: 10002, label: 'AGENTIA' },
];

// Estado por bridge (para el health endpoint combinado)
const state = {};
for (const b of BRIDGES) {
  state[b.clientId] = { pid: null, restarts: 0, alive: false, exitCode: null };
}

// ─── Utilidades de log ────────────────────────────────────────────────────────

function logLines(label, chunk) {
  const text = chunk.toString();
  for (const line of text.split('\n')) {
    const trimmed = line.trimEnd();
    if (trimmed) process.stdout.write(`[${label}] ${trimmed}\n`);
  }
}

function log(label, msg) {
  process.stdout.write(`[${label}] ${msg}\n`);
}

// ─── Spawn + auto-restart ─────────────────────────────────────────────────────

const MAX_RESTARTS   = 20;         // tope de reinicios por bridge
const RESTART_DELAY  = 5_000;     // 5 s entre reinicios normales
const BACKOFF_DELAY  = 60_000;    // 1 min si el bridge se cae repetidamente

function spawnBridge({ clientId, port, label }) {
  const s = state[clientId];

  if (s.restarts >= MAX_RESTARTS) {
    log(label, `⛔ Máximo de reinicios (${MAX_RESTARTS}) alcanzado. Deteniendo bridge.`);
    return;
  }

  log(label, `▶ Iniciando bridge (intento ${s.restarts + 1}) — PORT=${port} CLIENT_ID=${clientId}`);

  const child = spawn('node', [BRIDGE_SCRIPT], {
    env: {
      ...process.env,                         // hereda AGENTIA_CHATBOT_API_URL, MONGODB_URI, etc.
      AGENTIA_WHATSAPP_CLIENT_ID: clientId,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  s.pid   = child.pid;
  s.alive = true;
  s.exitCode = null;

  child.stdout.on('data', (chunk) => logLines(label, chunk));
  child.stderr.on('data', (chunk) => logLines(label, chunk));

  child.on('exit', (code, signal) => {
    s.alive    = false;
    s.exitCode = code;
    s.pid      = null;

    if (signal === 'SIGTERM') {
      log(label, `■ Detenido por SIGTERM.`);
      return; // no reiniciar si fue intencional
    }

    s.restarts++;
    const delay = s.restarts >= 5 ? BACKOFF_DELAY : RESTART_DELAY;
    log(label, `⚠ Proceso terminó (code=${code ?? signal}). Reiniciando en ${delay / 1000}s... (${s.restarts}/${MAX_RESTARTS})`);
    setTimeout(() => spawnBridge({ clientId, port, label }), delay);
  });

  child.on('error', (err) => {
    log(label, `✗ Error al iniciar proceso: ${err.message}`);
  });

  return child;
}

// ─── Arranque ─────────────────────────────────────────────────────────────────

log('MULTI  ', '════════════════════════════════════════');
log('MULTI  ', ' Agentia Multi-Bridge Worker arrancando');
log('MULTI  ', `════════════════════════════════════════`);
log('MULTI  ', `API URL: ${process.env.AGENTIA_CHATBOT_API_URL || '(no configurado)'}`);

// Escalonar el arranque 8 s entre bridges para no saturar Chromium simultáneo
const children = [];
BRIDGES.forEach((cfg, i) => {
  setTimeout(() => {
    const child = spawnBridge(cfg);
    if (child) children.push(child);
  }, i * 8_000);
});

// ─── Health endpoint combinado (PORT del worker en Render) ────────────────────

const HEALTH_PORT = Number(process.env.PORT) || 10000;

http.createServer((req, res) => {
  if (!req.url?.startsWith('/health')) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }

  const payload = {
    ok:      BRIDGES.every((b) => state[b.clientId].alive),
    bridges: BRIDGES.map((b) => ({
      clientId: b.clientId,
      port:     b.port,
      ...state[b.clientId],
    })),
    timestamp: new Date().toISOString(),
  };

  const allOk = payload.bridges.every((b) => b.alive);
  res.statusCode = allOk ? 200 : 503;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload, null, 2));
}).listen(HEALTH_PORT, () => {
  log('MULTI  ', `Health endpoint escuchando en :${HEALTH_PORT}/health`);
});

// ─── Shutdown limpio ──────────────────────────────────────────────────────────

function shutdown(sig) {
  log('MULTI  ', `${sig} recibido — deteniendo bridges...`);
  for (const child of children) {
    try { child.kill('SIGTERM'); } catch { /* ya terminó */ }
  }
  setTimeout(() => process.exit(0), 4_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
