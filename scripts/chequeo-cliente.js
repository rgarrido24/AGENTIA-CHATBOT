const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const GRAPH = 'https://graph.facebook.com/v21.0';
const pats = process.argv.slice(2);
if (!pats.length) { console.log('Uso: npm run chequeo:cliente -- matias yamila ...'); process.exit(0); }

function key() {
  const raw = (process.env.FB_TOKEN_ENCRYPTION_KEY || process.env.FB_APP_SECRET || '').trim();
  return crypto.createHash('sha256').update(raw).digest();
}
function dec(p) {
  const [i, t, d] = String(p).split(':');
  const c = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(i, 'hex'));
  c.setAuthTag(Buffer.from(t, 'hex'));
  return Buffer.concat([c.update(Buffer.from(d, 'hex')), c.final()]).toString('utf8');
}
async function get(path, token) {
  try {
    const r = await fetch(GRAPH + path, { headers: { Authorization: 'Bearer ' + token } });
    return await r.json().catch(() => ({}));
  } catch (e) { return { error: { message: String(e.message || e) } }; }
}
const err = b => (b && b.error ? '#' + (b.error.code || '?') + ' ' + String(b.error.message || '').slice(0, 160) : null);

MongoClient.connect(process.env.MONGODB_URI).then(async client => {
  const col = client.db('agentia_chatbot_ventas').collection('leads');
  for (const p of pats) {
    const rx = new RegExp(p, 'i');
    const clientes = await col.find({ _collection_type: 'reseller_client', $or: [{ clientSlug: rx }, { nombre: rx }, { name: rx }, { clientName: rx }] }).toArray();
    if (!clientes.length) { console.log('\n=== "' + p + '": NO ENCONTRADO ==='); continue; }
    for (const cli of clientes) {
      const slug = cli.clientSlug;
      const problemas = [];
      const fb = cli.fb_connection || {};
      console.log('\n==================== ' + slug + ' ====================');
      console.log('Conexion FB:', fb.status || '(sin conexion)', '| Pagina:', fb.page_id, '|', fb.page_name, '| conectado:', fb.connected_at || '-');
      console.log('Password definida:', cli.clientPasswordHash ? 'si' : 'NO', '| Alertas a:', cli.alertNumber || cli.telefono || '(sin numero)');
      const forms = cli.formularios || [];
      console.log('Formularios en Agentia:');
      forms.forEach(f => console.log('  ', f.formId, '| activo:', f.activo, '|', f.nombre || f.name || ''));
      const activosDB = forms.filter(f => f.activo).map(f => String(f.formId));
      if (!activosDB.length) problemas.push('No hay ningun formulario activo en Agentia');
      if (!fb.page_access_token || !fb.page_id) { problemas.push('Sin token/pagina: no esta conectado'); }
      else {
        let token = null;
        try { token = dec(fb.page_access_token); } catch (e) { problemas.push('No se pudo descifrar el token'); }
        if (token) {
          const appTok = (process.env.FB_APP_ID || '') + '|' + (process.env.FB_APP_SECRET || '');
          const dbg = await get('/debug_token?input_token=' + encodeURIComponent(token) + '&access_token=' + encodeURIComponent(appTok), appTok);
          const d = (dbg.data) || {};
          if (err(dbg)) problemas.push('debug_token: ' + err(dbg)); else if (!d.is_valid) problemas.push('Token INVALIDO (reconectar)');
          const sub = await get('/' + fb.page_id + '/subscribed_apps', token);
          const apps = sub.data || [];
          const leadgen = apps.some(a => (a.subscribed_fields || []).includes('leadgen'));
          console.log('Token valido:', d.is_valid, '| Suscrita a leadgen:', leadgen);
          if (err(sub)) problemas.push('subscribed_apps: ' + err(sub)); else if (!leadgen) problemas.push('Pagina NO suscrita a leadgen (reconectar)');
          const mf = await get('/' + fb.page_id + '/leadgen_forms?fields=id,name,status,leads_count&limit=50', token);
          if (err(mf)) problemas.push('leadgen_forms: ' + err(mf));
          else {
            console.log('Formularios en Meta:');
            (mf.data || []).forEach(x => console.log('  ', x.id, '|', x.status, '| leads:', x.leads_count, '|', x.name));
            const activosMeta = (mf.data || []).filter(x => x.status === 'ACTIVE').map(x => String(x.id));
            activosDB.forEach(id => { if (!activosMeta.includes(id)) problemas.push('Formulario ' + id + ' activo en Agentia pero NO esta ACTIVE en Meta'); });
            activosMeta.forEach(id => { if (!activosDB.includes(id)) console.log('  (aviso) ' + id + ' esta ACTIVE en Meta pero apagado en Agentia: no llegarian sus leads al panel'); });
          }
          for (const fid of activosDB) {
            const ml = await get('/' + fid + '/leads?fields=id,created_time&limit=100', token);
            if (err(ml)) { problemas.push('Leer leads de ' + fid + ': ' + err(ml)); continue; }
            const ids = (ml.data || []).map(x => String(x.id));
            const enDB = ids.length ? await col.find({ leadgen_id: { $in: ids } }, { projection: { leadgen_id: 1 } }).toArray() : [];
            const set = new Set(enDB.map(x => x.leadgen_id));
            const faltan = ids.filter(i => !set.has(i));
            console.log('Form ' + fid + ': en Meta ' + ids.length + ' | en Agentia ' + enDB.length + ' | FALTAN en panel: ' + faltan.length);
            if (faltan.length) problemas.push('Faltan ' + faltan.length + ' leads de Meta en el panel (form ' + fid + ')');
          }
        }
      }
      const total = await col.countDocuments({ clientSlug: slug, _collection_type: { $ne: 'reseller_client' } });
      const ult = await col.find({ clientSlug: slug, _collection_type: { $ne: 'reseller_client' } }, { projection: { createdAt: 1, nombre: 1, recuperado_manual: 1 } }).sort({ createdAt: -1 }).limit(1).toArray();
      console.log('Leads en panel:', total, '| ultimo:', ult[0] ? (new Date(ult[0].createdAt).toISOString().slice(0, 16) + ' ' + (ult[0].nombre || '')) : '-');
      console.log(problemas.length ? '>>> PROBLEMAS:\n   - ' + problemas.join('\n   - ') : '>>> TODO OK');
    }
  }
  client.close();
});
