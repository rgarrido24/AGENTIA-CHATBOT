#!/usr/bin/env node
/**
 * Da de baja clientes de un reseller (status:'inactivo'). NO borra leads, formularios ni historial.
 * Guarda respaldo del documento en client_reassign_backups. Ensayo por defecto.
 *
 *   node scripts/baja-clientes.js luciano laura-cardoso grupo-fusion-argentina martin-humberto simon-haddad
 *   node scripts/baja-clientes.js luciano laura-cardoso ... --apply
 */
const { MongoClient } = require('mongodb');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const [R, ...slugs] = args.filter(a => !a.startsWith('--'));
if (!R || !slugs.length) { console.error('Uso: node scripts/baja-clientes.js <resellerId> <slug1> <slug2> ... [--apply]'); process.exit(1); }

MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const db = c.db('agentia_chatbot_ventas');
  const col = db.collection('leads');
  console.log(APPLY ? '\n== APLICANDO BAJA ==' : '\n== ENSAYO (no escribe) ==');
  for (const slug of slugs) {
    const cli = await col.findOne({ resellerId: R, clientSlug: slug, _collection_type: 'reseller_client' });
    if (!cli) { console.log('•', slug, '→ NO ENCONTRADO'); continue; }
    const nLeads = await col.countDocuments({ clientSlug: slug, _collection_type: { $ne: 'reseller_client' } });
    console.log('•', slug, '(' + cli.nombre + ') | estado actual:', cli.status || 'activo', '| leads guardados:', nLeads, '| FB:', (cli.fb_connection && cli.fb_connection.status) || 'sin conexión');
    if (APPLY) {
      await db.collection('client_reassign_backups').insertOne({ tipo: 'baja', fecha: new Date(), resellerId: R, clientSlug: slug, doc: cli });
      await col.updateOne({ _id: cli._id }, { $set: { status: 'inactivo', baja_at: new Date() } });
      console.log('   → dado de baja (leads y formularios intactos)');
    }
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
