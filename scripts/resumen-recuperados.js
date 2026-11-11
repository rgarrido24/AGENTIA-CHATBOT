#!/usr/bin/env node
/**
 * Resumen (solo lectura) de leads recuperados manualmente desde Meta, por cliente.
 *   npm run resumen:recuperados                 (reseller luciano, ultimos 3 dias)
 *   npm run resumen:recuperados -- luciano 7    (ultimos 7 dias)
 */
const { MongoClient } = require('mongodb');
const R = process.argv[2] || 'luciano';
const DIAS = Number(process.argv[3] || 3);

MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const col = c.db('agentia_chatbot_ventas').collection('leads');
  const desde = new Date(Date.now() - DIAS * 86400000);
  const rows = await col.aggregate([
    { $match: { resellerId: R, recuperado_manual: true, es_prueba: { $ne: true } } },
    { $group: { _id: '$clientSlug', total: { $sum: 1 }, ultimaRecup: { $max: '$createdAt' } } },
    { $sort: { total: -1 } },
  ]).toArray();
  const nombres = {};
  (await col.find({ resellerId: R, _collection_type: 'reseller_client' }, { projection: { clientSlug: 1, nombre: 1 } }).toArray())
    .forEach(x => { nombres[x.clientSlug] = x.nombre; });
  let suma = 0;
  console.log('\n=== LEADS RECUPERADOS DESDE META (reseller ' + R + ') ===');
  rows.forEach(r => { suma += r.total; console.log(' ', (nombres[r._id] || r._id).padEnd(26), String(r.total).padStart(4)); });
  console.log('\n  TOTAL:', suma, 'leads en', rows.length, 'clientes\n');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
