const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
MongoClient.connect(uri).then(async c => {
  const db = c.db('agentia_chatbot_ventas');
  const result = await db.collection('leads').insertOne({
    _collection_type: 'reseller',
    resellerId: 'luciano',
    nombre: 'Luciano Puntillo',
    email: 'puntilloluciano@gmail.com',
    passwordHash: '146ab7e52ae015c4cc1833233c984d4f63413a34427f52342ab541da92ea0ceb',
    plan: 'pro',
    status: 'activo',
    alertNumber: '5493515920758',
    brandName: 'Luciano Ads Manager',
    brandLogo: '/luciano-logo.png',
    brandColor: '#CCFF00',
    showPoweredBy: true,
    createdAt: new Date()
  });
  console.log('Insertado:', result.insertedId);
  await c.close();
}).catch(e => { console.error(e); process.exit(1); });
