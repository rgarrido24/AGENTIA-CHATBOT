// Habilita PWA + push para un cliente de reseller existente.
// Uso: node scripts/enable-portal-pwa.js luciano antonio-campetella

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const pairs = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.trim().match(/^([^#=]+)=(.+)$/);
    if (m) pairs[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return pairs;
}

async function main() {
  const resellerId = (process.argv[2] || 'luciano').trim().toLowerCase();
  const clientSlug = (process.argv[3] || 'antonio-campetella').trim().toLowerCase();

  const root = path.join(__dirname, '..');
  const env = {
    ...loadEnvFile(path.join(root, '.env')),
    ...loadEnvFile(path.join(root, '.env.local')),
    ...process.env,
  };

  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB || 'agentia_chatbot_ventas';
  if (!uri) {
    console.error('❌ MONGODB_URI no encontrado');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection('leads').updateOne(
      { _collection_type: 'reseller_client', resellerId, clientSlug },
      { $set: { pwa_enabled: true, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      console.error(`❌ No existe cliente ${resellerId}/${clientSlug}`);
      process.exit(1);
    }

    console.log(`✅ PWA habilitada para ${resellerId}/${clientSlug}`);
    console.log(`   Portal: https://agentia.software/portal/${resellerId}/cliente/${clientSlug}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
