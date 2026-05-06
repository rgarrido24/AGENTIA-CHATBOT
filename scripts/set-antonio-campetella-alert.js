/**
 * Solo actualiza alertNumber (WhatsApp) para leads FB/Zapier del cliente
 * Antonio Campetella bajo reseller luciano. No modifica Deco House ni otros registros.
 *
 * Uso: MONGODB_URI=... [MONGODB_DB=...] node scripts/set-antonio-campetella-alert.js
 * o:   npm run set:antonio-fb-alert
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const RESELLER_ID = 'luciano';
const CLIENT_SLUG = 'antonio-campetella';
const ALERT_NUMBER = '5493518354796';

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const pairs = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (v.startsWith('\ufeff')) v = v.slice(1);
    pairs[k] = v;
  }
  return pairs;
}

async function main() {
  const root = path.join(__dirname, '..');
  const env = {
    ...loadEnvFile(path.join(root, '.env')),
    ...loadEnvFile(path.join(root, '.env.local')),
    ...process.env,
  };
  const uri = env.MONGODB_URI;
  const dbName = (env.MONGODB_DB || 'agentia_chatbot_ventas').trim();
  if (!uri) {
    console.error('❌ Falta MONGODB_URI (.env.local o variable de entorno)');
    process.exit(1);
  }

  const mc = new MongoClient(uri);
  await mc.connect();
  try {
    const db = mc.db(dbName);
    const filter = {
      _collection_type: 'reseller_client',
      resellerId: RESELLER_ID,
      clientSlug: CLIENT_SLUG,
    };
    const result = await db.collection('leads').updateOne(filter, {
      $set: { alertNumber: ALERT_NUMBER, updatedAt: new Date() },
    });
    if (result.matchedCount === 0) {
      console.error(
        `❌ No existe ${CLIENT_SLUG} bajo reseller "${RESELLER_ID}". Ejecutá antes: node scripts/seed-luciano.js`
      );
      process.exit(1);
    }
    console.log(`✅ alertNumber → ${ALERT_NUMBER} (${RESELLER_ID}/${CLIENT_SLUG})`);
  } finally {
    await mc.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
