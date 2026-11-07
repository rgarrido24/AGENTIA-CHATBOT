/**
 * Asigna a un cliente los leads de un formulario que quedaron "sin asignar" (resellerId 'unknown')
 * o sin clientSlug porque el formulario aún no estaba activo en su panel cuando llegaron.
 * DRY-RUN por defecto. Con --apply los asigna.
 *
 *   node scripts/reasignar-leads-form.js <clientSlug> <formId> [--apply]
 */
const { MongoClient } = require('mongodb');
const APPLY = process.argv.includes('--apply');
const [slug, formId] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!slug || !formId) { console.log('Uso: node scripts/reasignar-leads-form.js <clientSlug> <formId> [--apply]'); process.exit(1); }

MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const col = c.db(process.env.MONGODB_DB || 'agentia_chatbot_ventas').collection('leads');
  const cli = await col.findOne({ _collection_type: 'reseller_client', clientSlug: slug });
  if (!cli) { console.log('No existe el cliente ' + slug); return c.close(); }
  const activo = (cli.formularios || []).some(f => String(f.formId) === String(formId) && f.activo);
  console.log('Cliente:', cli.clientSlug, '|', cli.nombre, '| reseller:', cli.resellerId, '| formulario activo en su panel:', activo);
  if (!activo) { console.log('⛔ El formulario no está activo en ese cliente. Actívalo primero (fix-forms-cliente.js).'); return c.close(); }

  const filtro = {
    form_id: String(formId),
    _collection_type: { $ne: 'reseller_client' },
    es_prueba: { $ne: true },
    $or: [{ resellerId: 'unknown' }, { clientSlug: { $exists: false } }, { clientSlug: null }, { clientSlug: '' }],
  };
  const otros = await col.countDocuments({ form_id: String(formId), _collection_type: { $ne: 'reseller_client' }, clientSlug: { $nin: [slug, null, ''] } });
  if (otros) console.log('⚠️  Hay ' + otros + ' leads de este formulario asignados a OTRO cliente. No se tocan.');
  const huerfanos = await col.find(filtro, { projection: { nombre: 1, telefono: 1, createdAt: 1, resellerId: 1 } }).sort({ createdAt: 1 }).toArray();
  console.log('Leads sin asignar de este formulario:', huerfanos.length);
  huerfanos.forEach(l => console.log(' ', new Date(l.createdAt).toISOString().slice(0, 16), '|', (l.nombre || '(sin nombre)').padEnd(26), '|', l.telefono || '(sin tel)'));
  const ya = await col.countDocuments({ form_id: String(formId), clientSlug: slug, _collection_type: { $ne: 'reseller_client' }, es_prueba: { $ne: true } });
  console.log('Leads de este formulario ya en el panel del cliente:', ya);

  if (!APPLY) { console.log('\n(DRY-RUN: no se cambió nada. Agrega --apply para asignarlos.)'); return c.close(); }
  if (!huerfanos.length) { console.log('Nada que asignar.'); return c.close(); }
  const r = await col.updateMany(filtro, { $set: { resellerId: cli.resellerId, clientSlug: slug, updatedAt: new Date(), reasignado_manual: true } });
  console.log('\n✅ Asignados:', r.modifiedCount);
  c.close();
}).catch(e => { console.error(e.message || e); process.exit(1); });
