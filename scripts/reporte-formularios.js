#!/usr/bin/env node
/**
 * Reporte (solo lectura): clientes con MAS de un formulario activo y clientes sin formulario activo.
 * Por cada formulario activo muestra leads de los ultimos 30 dias y fecha del ultimo lead,
 * para que Luciano diga cual es el que de verdad usa en sus anuncios.
 *
 *   npm run reporte:formularios            (reseller luciano)
 *   npm run reporte:formularios -- luciano
 */
const { MongoClient } = require('mongodb');
const R = process.argv[2] || 'luciano';
const fecha = d => (d ? new Date(d).toISOString().slice(0, 10) : '-');

MongoClient.connect(process.env.MONGODB_URI).then(async c => {
  const col = c.db('agentia_chatbot_ventas').collection('leads');
  const clientes = await col.find({ resellerId: R, _collection_type: 'reseller_client' }).toArray();
  const hace30 = new Date(Date.now() - 30 * 86400000);
  const multi = [], sin = [];
  let activos = 0;

  for (const cli of clientes) {
    if (String(cli.status || '').toLowerCase() === 'inactivo') continue;
    activos++;
    const act = (cli.formularios || []).filter(f => f.activo);
    if (act.length === 0) { sin.push(cli.nombre); continue; }
    if (act.length < 2) continue;
    const filas = [];
    for (const f of act) {
      const base = { clientSlug: cli.clientSlug, form_id: String(f.formId), _collection_type: { $ne: 'reseller_client' }, es_prueba: { $ne: true } };
      const n30 = await col.countDocuments({ ...base, createdAt: { $gte: hace30 } });
      const ult = await col.find(base, { projection: { createdAt: 1 } }).sort({ createdAt: -1 }).limit(1).toArray();
      filas.push({ nombre: f.formName || f.formId, id: f.formId, n30, ultimo: ult[0] && ult[0].createdAt });
    }
    multi.push({ cliente: cli.nombre, slug: cli.clientSlug, filas });
  }

  console.log('\n=== CLIENTES ACTIVOS: ' + activos + ' | con 1 formulario: ' + (activos - multi.length - sin.length) + ' | con VARIOS: ' + multi.length + ' | sin formulario activo: ' + sin.length);
  console.log('\n=== CON MAS DE UN FORMULARIO ACTIVO (' + multi.length + ') — ¿cual es el que usan en sus anuncios?');
  multi.sort((a, b) => a.cliente.localeCompare(b.cliente)).forEach(m => {
    console.log('\n' + m.cliente + ' (' + m.slug + ')');
    m.filas.forEach(f => console.log('   - ' + f.nombre + ' | ID ' + f.id + ' | leads 30d: ' + f.n30 + ' | ultimo lead: ' + fecha(f.ultimo)));
  });
  console.log('\n=== SIN FORMULARIO ACTIVO (' + sin.length + ')');
  sin.forEach(n => console.log('   - ' + n));
  console.log('');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
