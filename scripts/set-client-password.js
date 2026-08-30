/**
 * Set (or reset) a reseller_client's portal password.
 * Usage: MONGODB_URI=<uri> node scripts/set-client-password.js <resellerId> <clientSlug> <password>
 * Example: MONGODB_URI=... node scripts/set-client-password.js luciano antonio-campetella antonio2026
 */
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const PASS_SALT = 'reseller_pass_salt_2026';

function hashPassword(raw) {
  return crypto.createHash('sha256').update(raw + PASS_SALT).digest('hex');
}

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, 'm');
  const m  = envText.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function main() {
  const [,, resellerId, clientSlug, password] = process.argv;
  if (!resellerId || !clientSlug || !password) {
    console.error('Uso: node scripts/set-client-password.js <resellerId> <clientSlug> <password>');
    process.exit(1);
  }

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

  const hash   = hashPassword(password);
  const result = await db.collection('leads').updateOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { $set: { clientPasswordHash: hash, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    console.error(`No se encontró cliente: resellerId="${resellerId}" clientSlug="${clientSlug}"`);
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, resellerId, clientSlug, modified: result.modifiedCount }, null, 2));
  await client.close();
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
