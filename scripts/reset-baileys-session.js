#!/usr/bin/env node
/**
 * Reset sesión Baileys (libsignal) en MongoDB — fuerza nuevo QR al reiniciar el bridge.
 *
 * Borra:
 *   - whatsapp_sessions  → creds + keys (causa típica de "Bad MAC")
 *   - whatsapp_qr        → estado/QR del clientId
 *
 * Uso:
 *   node scripts/reset-baileys-session.js
 *   node scripts/reset-baileys-session.js decohouse
 *   node scripts/reset-baileys-session.js --all
 *
 * IMPORTANTE: detén o reinicia el servicio Baileys en Railway DESPUÉS de ejecutar esto.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadEnv() {
  const root = path.join(__dirname, '..');
  const pairs = {};
  for (const file of ['.env.local', '.env']) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 1) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      pairs[t.slice(0, eq).trim()] = v;
    }
  }
  return { ...pairs, ...process.env };
}

const ENV = loadEnv();
const args = process.argv.slice(2);
const resetAll = args.includes('--all');
const CLIENT_ID = (args.find((a) => !a.startsWith('--')) || 'decohouse').trim().toLowerCase();

async function main() {
  const uri = ENV.MONGODB_URI;
  const dbName = ENV.MONGODB_DB || ENV.MONGO_DB || 'agentia_chatbot_ventas';
  if (!uri) {
    console.error('❌ Falta MONGODB_URI');
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });
  await client.connect();
  const db = client.db(dbName);

  console.log(`\n🔧 Reset Baileys — DB: ${dbName}`);
  if (resetAll) {
    console.log('   Modo: TODOS los clientId\n');
  } else {
    console.log(`   clientId: ${CLIENT_ID}\n`);
  }

  const sessionFilter = resetAll ? {} : { clientId: CLIENT_ID };
  const qrFilter = resetAll
    ? {}
    : { _id: { $in: [CLIENT_ID, 'current'] } };

  const [sessions, qr] = await Promise.all([
    db.collection('whatsapp_sessions').deleteMany(sessionFilter),
    db.collection('whatsapp_qr').deleteMany(qrFilter),
  ]);

  console.log(`✅ whatsapp_sessions eliminados: ${sessions.deletedCount}`);
  console.log(`✅ whatsapp_qr eliminados:       ${qr.deletedCount}`);

  const remaining = await db.collection('whatsapp_sessions').countDocuments(
    resetAll ? {} : { clientId: CLIENT_ID }
  );
  if (remaining > 0) {
    console.warn(`⚠️  Aún quedan ${remaining} doc(s) en whatsapp_sessions`);
  } else {
    console.log('\n✅ Sesión limpia. Reinicia el bridge en Railway para ver un QR nuevo.');
    console.log('   Panel: /demo/deco-house/bridge o GET /api/whatsapp/qr?clientId=decohouse');
  }

  await client.close();
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
