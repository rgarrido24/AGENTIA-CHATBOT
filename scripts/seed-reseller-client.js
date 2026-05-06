const { MongoClient } = require('mongodb');
const dbName = process.env.MONGODB_DB || 'agentia_chatbot_ventas';
MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const db = c.db(dbName);

  // Upsert — no duplica si ya existe
  const result = await db.collection('leads').updateOne(
    {
      _collection_type: 'reseller_client',
      resellerId: 'luciano',
      clientSlug: 'antonio-campetella',
    },
    {
      $set: {
        _collection_type: 'reseller_client',
        resellerId: 'luciano',
        clientSlug: 'antonio-campetella',
        nombre: 'Antonio Campetella',
        negocio: 'Servicios financieros Córdoba',
        telefono: '5493515920758',
        alertNumber: '5493518354796',
        formularios: [{
          formId: '1450524039906078',
          formName: 'LEADS NUEVO (3 rangos de edad)',
          plataforma: 'fb/ig',
          activo: true
        }],
        status: 'activo',
        // Este campo conecta con todos los leads históricos de FB Ads
        // anteriores al sistema de resellers
        legacyQuery: { clientId: 'agentia-ventas', canal_origen: 'fb-ads' },
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log('✅ Cliente creado:', result.upsertedId);
  } else {
    console.log('✅ Cliente actualizado (ya existía)');
  }
  await c.close();
}).catch(e => { console.error(e); process.exit(1); });
