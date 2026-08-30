/**
 * One-off: set brandLogo, brandName, brandColor for Luciano in colección leads.
 * Run: MONGODB_URI=<uri> npm run update:reseller-brand
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
  const root    = path.join(__dirname, '..');
  const readEnv = (f) => { const p = path.join(root, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const uri     = process.env.MONGODB_URI || getEnvValue(readEnv('.env.local'), 'MONGODB_URI') || getEnvValue(readEnv('.env'), 'MONGODB_URI');
  const dbName  = getEnvValue(readEnv('.env.local'), 'MONGODB_DB') || getEnvValue(readEnv('.env'), 'MONGODB_DB') || undefined;
  if (!uri) throw new Error('No se encontró MONGODB_URI');

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db  = dbName ? client.db(dbName) : client.db();

  const result = await db.collection('leads').updateOne(
    { _collection_type: 'reseller', resellerId: 'luciano' },
    {
      $set: {
        brandLogo:  '/luciano-logo.png',
        brandName:  'Luciano Ads Mánager',
        brandColor: '#CCFF00',
        updatedAt:  new Date(),
      },
    }
  );

  console.log(JSON.stringify({
    ok:       true,
    resellerId: 'luciano',
    matched:  result.matchedCount,
    modified: result.modifiedCount,
  }, null, 2));

  await client.close();
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
