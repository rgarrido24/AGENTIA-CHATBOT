/**
 * Recupera de Meta los leads faltantes de VARIOS clientes a la vez (todos sus formularios ACTIVOS).
 * Ensayo por defecto. Exige SINCE (AAAA-MM-DD) para no traer historial viejo.
 *
 *   SINCE=2026-11-08 node scripts/recuperar-varios.js slug1 slug2 slug3
 *   APPLY=1 SINCE=2026-11-08 node scripts/recuperar-varios.js slug1 slug2 slug3
 */
const { MongoClient } = require('mongodb');
const { spawnSync } = require('child_process');
const path = require('path');
const slugs = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!slugs.length || !/^\d{4}-\d{2}-\d{2}$/.test(process.env.SINCE || '')) {
  console.log('Uso: SINCE=AAAA-MM-DD [APPLY=1] node scripts/recuperar-varios.js slug1 slug2 ...'); process.exit(1);
}
(async () => {
  const c = await MongoClient.connect(process.env.MONGODB_URI);
  const col = c.db(process.env.MONGODB_DB || 'agentia_chatbot_ventas').collection('leads');
  console.log(process.env.APPLY === '1' ? '== MODO INSERTAR ==' : '== ENSAYO (no escribe) ==', '| desde', process.env.SINCE, '\n');
  for (const slug of slugs) {
    const cli = await col.findOne({ _collection_type: 'reseller_client', clientSlug: slug });
    if (!cli) { console.log('• ' + slug + ': NO EXISTE'); continue; }
    const forms = (cli.formularios || []).filter(f => f.activo);
    const nativo = cli.fb_connection && cli.fb_connection.status === 'connected';
    if (!nativo) { console.log('• ' + slug + ' (' + cli.nombre + '): ⛔ sin Facebook conectado, salto'); continue; }
    if (!forms.length) { console.log('• ' + slug + ' (' + cli.nombre + '): sin formularios activos'); continue; }
    for (const f of forms) {
      const r = spawnSync('node', [path.join(__dirname, 'recuperar-leads-meta.js'), slug, String(f.formId)], { env: process.env, encoding: 'utf8' });
      const out = (r.stdout || '') + (r.stderr || '');
      const keep = out.split('\n').filter(l => /Leads en Meta|^Desde|Ya existentes|INSERTADOS|ABORTO|Graph #|Error/.test(l)).map(l => '    ' + l.trim());
      console.log('• ' + slug + ' (' + cli.nombre + ') | ' + (f.formName || f.formId));
      console.log(keep.join('\n') || '    (sin salida)');
    }
  }
  c.close();
})().catch(e => { console.error(e.message || e); process.exit(1); });
