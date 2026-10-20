#!/usr/bin/env node
/**
 * Listado de clientes de un reseller con su estado de conexion a Facebook y la pagina
 * (solo lectura). Sirve para planear la migracion de Zapier a la conexion nativa.
 *
 *   npm run listado:migracion            (reseller luciano)
 *   npm run listado:migracion -- luciano
 */
const { MongoClient } = require('mongodb');
const R = process.argv[2] || 'luciano';

MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const col = c.db('agentia_chatbot_ventas').collection('leads');
  const clientes = await col.find({ resellerId: R, _collection_type: 'reseller_client' }).toArray();
  const hace30 = new Date(Date.now() - 30 * 86400000);
  const filas = [];
  for (const cli of clientes) {
    if (String(cli.status || '').toLowerCase() === 'inactivo') continue;
    const slug = cli.clientSlug;
    const nativo = cli.fb_connection && cli.fb_connection.status === 'connected';
    const forms = (cli.formularios || []).filter(f => f.activo);
    const filter = { clientSlug: slug, _collection_type: { $ne: 'reseller_client' }, es_prueba: { $ne: true } };
    const ult = await col.find(filter, { projection: { createdAt: 1, page_name: 1, form_name: 1 } }).sort({ createdAt: -1 }).limit(1).toArray();
    const conPagina = await col.find({ ...filter, page_name: { $exists: true, $ne: '' } }, { projection: { page_name: 1 } }).sort({ createdAt: -1 }).limit(1).toArray();
    const n30 = await col.countDocuments({ ...filter, createdAt: { $gte: hace30 } });
    filas.push({
      nombre: cli.nombre, slug, nativo: !!nativo,
      pagina: nativo ? cli.fb_connection.page_name : (conPagina[0] && conPagina[0].page_name) || '(sin dato)',
      formularios: forms.map(f => (f.formName || f.formId)).join(' + ') || '(ninguno activo)',
      ultimo: ult[0] ? new Date(ult[0].createdAt).toISOString().slice(0, 10) : '-',
      n30,
    });
  }
  const pend = filas.filter(f => !f.nativo).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const ok = filas.filter(f => f.nativo).sort((a, b) => a.nombre.localeCompare(b.nombre));
  console.log('\n=== PENDIENTES DE MIGRAR (' + pend.length + ') — cliente | pagina | formulario activo | ultimo lead | leads 30d');
  pend.forEach(f => console.log(' ', f.nombre, '|', f.pagina, '|', f.formularios, '|', f.ultimo, '|', f.n30));
  console.log('\n=== YA CONECTADOS (' + ok.length + ') — cliente | pagina | ultimo lead | leads 30d');
  ok.forEach(f => console.log(' ', f.nombre, '|', f.pagina, '|', f.ultimo, '|', f.n30));
  c.close();
});
