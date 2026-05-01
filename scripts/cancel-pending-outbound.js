/**
 * URGENTE: cancela todos los outbound_messages pendientes dirigidos a leads.
 * Preserva solo las alertas de admin (source: 'admin-alert').
 * Run: node scripts/cancel-pending-outbound.js
 */
const fs   = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, 'm');
  const m  = envText.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function main() {
  const root     = path.join(__dirname, '..');
  const readEnv  = (f) => { const p = path.join(root, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const envLocal = readEnv('.env.local');
  const envEnv   = readEnv('.env');
  const uri    = process.env.MONGODB_URI || getEnvValue(envLocal, 'MONGODB_URI') || getEnvValue(envEnv, 'MONGODB_URI');
  const dbName = getEnvValue(envLocal, 'MONGODB_DB') || getEnvValue(envEnv, 'MONGODB_DB') || undefined;
  if (!uri) throw new Error('No se encontró MONGODB_URI');

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db  = dbName ? client.db(dbName) : client.db();
  const col = db.collection('outbound_messages');

  // Count first so user can see what will be cancelled
  const count = await col.countDocuments({
    sentAt: { $exists: false },
    source: { $ne: 'admin-alert' },
  });
  console.log(`Pendientes a cancelar: ${count}`);

  const result = await col.updateMany(
    { sentAt: { $exists: false }, source: { $ne: 'admin-alert' } },
    { $set: { sentAt: new Date(), cancelledAt: new Date(), cancelReason: 'manual-cancel-2026-05-01' } }
  );

  console.log(JSON.stringify({ ok: true, cancelled: result.modifiedCount }, null, 2));
  await client.close();
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
