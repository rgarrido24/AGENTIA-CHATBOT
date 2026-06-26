/**
 * Seed client_configs + conversaciones de ejemplo para Biovela.
 * Uso: node scripts/seed-biovela-panel.js
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || 'agentia_chatbot_ventas';

async function main() {
  if (!MONGODB_URI) {
    console.error('Falta MONGODB_URI');
    process.exit(1);
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB);

  await db.collection('client_configs').updateOne(
    { clientId: 'biovela' },
    {
      $set: {
        clientId: 'biovela',
        name: 'Biovela',
        logoUrl: '/logos/biovela.png',
        accent: '#D4860A',
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  const sample = {
    clientId: 'biovela',
    phone: '5491112345678',
    contactName: 'María García',
    stage: 'interesado',
    tags: ['menudeo', 'aromas'],
    notes: 'Interesada en velas de lavanda para regalo.',
    humanMode: false,
    unreadCount: 1,
    messages: [
      {
        id: new ObjectId().toHexString(),
        role: 'user',
        content: 'Hola, ¿tienen velas de soja?',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: new ObjectId().toHexString(),
        role: 'bot',
        content: '¡Hola! Sí, tenemos varias fragancias. ¿Buscas mayoreo o menudeo?',
        createdAt: new Date(Date.now() - 3500000),
        productCard: {
          image: '/logos/biovela.png',
          name: 'Vela de soja Lavanda',
          price: '$189 MXN',
        },
      },
      {
        id: new ObjectId().toHexString(),
        role: 'user',
        content: 'Menudeo, ¿cuánto cuesta el envío?',
        createdAt: new Date(Date.now() - 300000),
      },
    ],
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  await db.collection('conversations').updateOne(
    { clientId: 'biovela', phone: sample.phone },
    { $set: sample },
    { upsert: true }
  );

  console.log('✅ Biovela panel seed OK');
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
