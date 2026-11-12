#!/usr/bin/env node
/**
 * Caso extraordinario: permite que un cliente tenga varios formularios activos al reconectar Facebook.
 * Por defecto cada cliente deja UN solo formulario activo.
 *   node scripts/multi-formulario.js <resellerId> <slug> on|off
 */
const { MongoClient } = require('mongodb');
const [R, slug, modo] = process.argv.slice(2);
if (!R || !slug || !['on', 'off'].includes(modo)) { console.error('Uso: node scripts/multi-formulario.js <resellerId> <slug> on|off'); process.exit(1); }
MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const col = c.db('agentia_chatbot_ventas').collection('leads');
  const r = await col.updateOne({ resellerId: R, clientSlug: slug, _collection_type: 'reseller_client' }, { $set: { multi_formulario: modo === 'on' } });
  console.log(r.matchedCount ? ('multi_formulario = ' + (modo === 'on') + ' para ' + slug) : 'Cliente no encontrado');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
