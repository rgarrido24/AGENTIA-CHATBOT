const { MongoClient } = require('mongodb');
MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const db = c.db('agentia_chatbot_ventas');
  await db.collection('leads').insertOne({
    _collection_type: 'reseller_client',
    resellerId: 'luciano',
    clientSlug: 'antonio-campetella',
    nombre: 'Antonio Campetella',
    negocio: 'Servicios financieros Córdoba',
    telefono: '5493515920758',
    alertNumber: '5493515920758',
    formularios: [{
      formId: '1450524039906078',
      formName: 'LEADS NUEVO (3 rangos de edad)',
      plataforma: 'fb/ig',
      activo: true
    }],
    status: 'activo',
    createdAt: new Date()
  });
  console.log('Cliente insertado');
  await c.close();
}).catch(e => { console.error(e); process.exit(1); });
