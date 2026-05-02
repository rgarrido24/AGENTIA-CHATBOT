/**
 * Update a reseller's brandLogo and brandName in MongoDB.
 * Usage: node scripts/update-reseller-brand.js <resellerId> <brandLogo> <brandName>
 * Example: MONGODB_URI=<uri> node scripts/update-reseller-brand.js luciano '/luciano-logo.png' 'Luciano Ads Mánager'
 */
const fs   = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getEnvValue(text, key) {
  const m = text.match(new RegExp(`^${key}=(.+)$`, 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function main() {
  const [,, resellerId, brandLogo, brandName] = process.argv;
  if (!resellerId || !brandLogo || !brandName) {
    console.error('Usage: node scripts/update-reseller-brand.js <resellerId> <brandLogo> <brandName>');
    process.exit(1);
  }

  const root    = path.join(__dirname, '..');
  const readEnv = (f) => { const p = path.join(root, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const uri     = process.env.MONGODB_URI || getEnvValue(readEnv('.env.local'), 'MONGODB_URI') || getEnvValue(readEnv('.env'), 'MONGODB_URI');
  const dbName  = getEnvValue(readEnv('.env.local'), 'MONGODB_DB') || getEnvValue(readEnv('.env'), 'MONGODB_DB') || undefined;
  if (!uri) throw new Error('No se encontró MONGODB_URI');

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db  = dbName ? client.db(dbName) : client.db();
  const col = db.collection('leads');

  const result = await col.updateOne(
    { _collection_type: 'reseller', resellerId },
    { $set: { brandLogo, brandName, updatedAt: new Date() } }
  );

  console.log(JSON.stringify({
    ok:       true,
    resellerId,
    brandLogo,
    brandName,
    matched:  result.matchedCount,
    modified: result.modifiedCount,
  }, null, 2));

  await client.close();
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
