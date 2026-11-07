/**
 * Borra de un cliente los leads RECUPERADOS A MANO (recuperado_manual) de un formulario que son
 * anteriores a una fecha. Útil si se recuperó el historial completo por error.
 * Solo toca leads con recuperado_manual:true. DRY-RUN por defecto.
 *
 *   node scripts/limpiar-recuperados.js <clientSlug> <formId> <AAAA-MM-DD> [--apply]
 * Se borran los anteriores a esa fecha (00:00 hora de México, UTC-6).
 */
const { MongoClient } = require('mongodb');
const APPLY = process.argv.includes('--apply');
const [slug, formId, desde] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!slug || !formId || !/^\d{4}-\d{2}-\d{2}$/.test(desde || '')) {
  console.log('Uso: node scripts/limpiar-recuperados.js <clientSlug> <formId> <AAAA-MM-DD> [--apply]'); process.exit(1);
}
const limite = new Date(desde + 'T00:00:00-06:00');
MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const db = c.db(process.env.MONGODB_DB || 'agentia_chatbot_ventas');
  const col = db.collection('leads');
  const base = { clientSlug: slug, form_id: String(formId), recuperado_manual: true, _collection_type: { $ne: 'reseller_client' } };
  const viejos = await col.find({ ...base, createdAt: { $lt: limite } }, { projection: { nombre: 1, createdAt: 1, leadgen_id: 1 } }).sort({ createdAt: 1 }).toArray();
  const quedan = await col.find({ clientSlug: slug, _collection_type: { $ne: 'reseller_client' }, $nor: [{ ...base, createdAt: { $lt: limite } }] }, { projection: { nombre: 1, createdAt: 1 } }).sort({ createdAt: 1 }).toArray();
  console.log('Se BORRARÍAN (recuperados anteriores a ' + desde + '):', viejos.length);
  if (viejos.length) console.log('  del', new Date(viejos[0].createdAt).toISOString().slice(0, 10), 'al', new Date(viejos[viejos.length - 1].createdAt).toISOString().slice(0, 10));
  console.log('Se QUEDAN en el panel:', quedan.length);
  quedan.forEach(l => console.log('  ', new Date(l.createdAt).toISOString().slice(0, 16), '|', l.nombre));
  if (!APPLY) { console.log('\n(DRY-RUN: no se borró nada. Agrega --apply para borrar.)'); return c.close(); }
  if (!viejos.length) { console.log('Nada que borrar.'); return c.close(); }
  await db.collection('client_reassign_backups').insertOne({ tipo: 'limpiar-recuperados', clientSlug: slug, formId, desde, leads: viejos.length, docs: await col.find({ ...base, createdAt: { $lt: limite } }).toArray(), fecha: new Date() });
  const r = await col.deleteMany({ ...base, createdAt: { $lt: limite } });
  console.log('\n✅ Borrados:', r.deletedCount, '(copia guardada en client_reassign_backups). Quedan en el panel:', await col.countDocuments({ clientSlug: slug, _collection_type: { $ne: 'reseller_client' } }));
  c.close();
}).catch(e => { console.error(e.message || e); process.exit(1); });
