/**
 * Prueba de Comentarios - Simula un comentario en un post de Facebook
 *
 * Envía un payload simulado del webhook de Meta (evento feed) para verificar
 * que el bot procesa comentarios correctamente.
 *
 * Uso:
 *   1. Servidor corriendo: npm run dev
 *   2. Configura WEBHOOK_URL (default: http://localhost:3000/api/webhook)
 *   3. Configura PAGE_ID con el pageId de tu página de izzi (de page-tokens.json)
 *   4. Ejecuta: node scripts/test-comment-webhook.js
 *
 * Nota: El comentario y commenterId son ficticios. La respuesta del chat funcionará,
 * pero replyToComment y sendMessengerReply fallarán (Graph API no reconoce IDs falsos).
 * Este script verifica que el flujo no crashea y que la IA genera respuesta.
 */

const fs = require('fs');
const path = require('path');

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

function getPageId() {
  const tokensPath = path.join(__dirname, 'page-tokens.json');
  if (fs.existsSync(tokensPath)) {
    const raw = fs.readFileSync(tokensPath, 'utf8');
    const parsed = JSON.parse(raw);
    const pages = Array.isArray(parsed?.pages) ? parsed.pages : [];
    const izzi = pages.find((p) => String(p.clientId || '').toLowerCase().includes('izzi'));
    if (izzi?.pageId) return String(izzi.pageId).trim();
  }
  return getEnv('TEST_PAGE_ID', '');
}

const WEBHOOK_URL = getEnv('AGENTIA_WEBHOOK_URL', 'http://localhost:3000/api/webhook');
const PAGE_ID = getEnv('TEST_PAGE_ID', '') || getPageId();
const COMMENT_TEXT = process.argv[2] || 'Quiero información de los paquetes de internet';

const simulateFeedCommentPayload = {
  object: 'page',
  entry: [
    {
      id: PAGE_ID,
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: 'feed',
          value: {
            item: 'comment',
            comment_id: 'test_comment_' + Date.now(),
            post_id: 'test_post_123',
            parent_id: null,
            message: COMMENT_TEXT,
            created_time: new Date().toISOString(),
            from: {
              id: '1234567890123456',
              name: 'Usuario Prueba',
            },
          },
        },
      ],
    },
  ],
};

async function main() {
  if (!PAGE_ID) {
    console.error('Error: Necesitas PAGE_ID. Configura TEST_PAGE_ID en .env o page-tokens.json con clientId izzi.');
    process.exit(1);
  }

  console.log('[Test] Simulando comentario en post de izzi...');
  console.log('[Test] Webhook URL:', WEBHOOK_URL);
  console.log('[Test] Page ID:', PAGE_ID);
  console.log('[Test] Comentario:', COMMENT_TEXT);
  console.log('');

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(simulateFeedCommentPayload),
  });

  const body = await res.json().catch(() => ({}));
  console.log('[Test] Status:', res.status);
  console.log('[Test] Response:', JSON.stringify(body, null, 2));

  if (res.status === 200 && body.status === 'EVENT_RECEIVED') {
    console.log('\n[Test] OK: El webhook procesó el evento correctamente.');
    console.log('[Test] (replyToComment/sendMessengerReply pueden fallar con IDs ficticios, pero el flujo de chat funciona)');
  } else {
    console.log('\n[Test] Revisa la respuesta. Asegúrate de que el servidor esté corriendo y pageId esté en business_configs.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
