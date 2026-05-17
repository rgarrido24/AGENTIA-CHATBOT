/**
 * start-baileys.js — Entrypoint Railway / worker para Baileys bridge.
 *
 * Uso:
 *   npm run bridge:baileys
 *   node scripts/start-baileys.js
 *
 * Variables:
 *   AGENTIA_WHATSAPP_CLIENT_IDS=izzi,agentia-ventas,...
 *   AGENTIA_CHATBOT_API_URL, MONGODB_URI, MONGODB_DB, PORT, WHATSAPP_QR_SECRET, CRON_SECRET
 */

'use strict';

require('./baileys-bridge.js');
