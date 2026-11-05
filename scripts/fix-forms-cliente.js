/**
 * Deja ACTIVO un solo formulario en un cliente y verifica contra Meta que todo quede conectado.
 * Por defecto es DRY-RUN (no escribe nada). Con --apply guarda el cambio (y un respaldo).
 *
 * Uso (Render shell):
 *   node scripts/fix-forms-cliente.js <resellerId> <slugOParteDelNombre> <formId> [--apply]
 * Ejemplo:
 *   node scripts/fix-forms-cliente.js luciano carla 1153502800472590
 *   node scripts/fix-forms-cliente.js luciano carla-zonas 1153502800472590 --apply
 */
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const GRAPH = 'https://graph.facebook.com/v21.0';
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const APPLY = process.argv.includes('--apply');
const [resellerId, pat, formId] = args;
if (!resellerId || !pat || !formId) {
  console.log('Uso: node scripts/fix-forms-cliente.js <resellerId> <slugOParteDelNombre> <formId> [--apply]');
  process.exit(1);
}
const key = () => crypto.createHash('sha256').update((process.env.FB_TOKEN_ENCRYPTION_KEY || process.env.FB_APP_SECRET || '').trim()).digest();
function dec(p) {
  const [i, t, d] = String(p).split(':');
  const c = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(i, 'hex'));
  c.setAuthTag(Buffer.from(t, 'hex'));
  return Buffer.concat([c.update(Buffer.from(d, 'hex')), c.final()]).toString('utf8');
}
async function get(path, token) {
  try { const r = await fetch(GRAPH + path, { headers: { Authorization: 'Bearer ' + token } }); return await r.json().catch(() => ({})); }
  catch (e) { return { error: { message: String(e.message || e) } }; }
}
const err = b => (b && b.error ? '#' + (b.error.code || '?') + ' ' + String(b.error.message || '').slice(0, 200) : null);
const stop = (m) => { console.log('\n⛔ ' + m); process.exit(1); };

MongoClient.connect(process.env.MONGODB_URI).then(async client => {
  const col = client.db(process.env.MONGODB_DB || 'agentia_chatbot_ventas').collection('leads');
  const rx = new RegExp(pat, 'i');
  const found = await col.find({ _collection_type: 'reseller_client', resellerId, $or: [{ clientSlug: rx }, { nombre: rx }] }).toArray();
  if (!found.length) stop('No encontré ningún cliente de "' + resellerId + '" que coincida con "' + pat + '".');
  let cli = found.find(c => c.clientSlug === pat) || (found.length === 1 ? found[0] : null);
  if (!cli) { console.log('Hay varios clientes que coinciden, usa el slug exacto:'); found.forEach(c => console.log('  ', c.clientSlug, '|', c.nombre)); process.exit(1); }

  const fb = cli.fb_connection || {};
  console.log('Cliente:', cli.clientSlug, '|', cli.nombre);
  console.log('Facebook:', fb.status || '(sin conexión)', '| Página:', fb.page_id, '|', fb.page_name);
  const prev = cli.formularios || [];
  console.log('Formularios ahora en Agentia:');
  prev.forEach(f => console.log('  ', f.formId, '| activo:', f.activo, '|', f.formName || f.nombre || ''));

  // 1) Que el formulario no esté activo en OTRO cliente (mezclaría leads)
  const otros = await col.find({ _collection_type: 'reseller_client', 'formularios.formId': formId, 'formularios.activo': true, clientSlug: { $ne: cli.clientSlug } }, { projection: { clientSlug: 1, resellerId: 1, nombre: 1 } }).toArray();
  if (otros.length) stop('El formulario ' + formId + ' está ACTIVO en otro cliente: ' + otros.map(o => o.resellerId + '/' + o.clientSlug + ' (' + o.nombre + ')').join(', ') + '. Hay que apagarlo ahí primero o los leads se mezclan.');

  // 2) Verificación contra Meta
  if (!fb.page_access_token || !fb.page_id) stop('El cliente no tiene página conectada (falta token). Conecta Facebook primero.');
  let token; try { token = dec(fb.page_access_token); } catch (e) { stop('No pude descifrar el token. Reconecta Facebook.'); }
  const appTok = (process.env.FB_APP_ID || '') + '|' + (process.env.FB_APP_SECRET || '');
  const dbg = await get('/debug_token?input_token=' + encodeURIComponent(token) + '&access_token=' + encodeURIComponent(appTok), appTok);
  const valido = !!(dbg.data && dbg.data.is_valid);
  const sub = await get('/' + fb.page_id + '/subscribed_apps', token);
  const leadgen = (sub.data || []).some(a => (a.subscribed_fields || []).includes('leadgen'));
  const mf = await get('/' + fb.page_id + '/leadgen_forms?fields=id,name,status,leads_count&limit=100', token);
  const metaForm = (mf.data || []).find(x => String(x.id) === String(formId));
  console.log('\nVerificación en Meta:');
  console.log('  Token válido:', valido, '| Suscrita a leadgen:', leadgen);
  console.log('  Formularios de la página:');
  (mf.data || []).forEach(x => console.log('    ', x.id, '|', x.status, '| leads:', x.leads_count, '|', x.name));
  const problemas = [];
  if (!valido) problemas.push('El token NO es válido (reconectar Facebook)');
  if (err(sub)) problemas.push('subscribed_apps: ' + err(sub)); else if (!leadgen) problemas.push('La página NO está suscrita a leadgen (reconectar Facebook)');
  if (err(mf)) problemas.push('leadgen_forms: ' + err(mf));
  else if (!metaForm) problemas.push('El formulario ' + formId + ' NO pertenece a la página conectada (' + fb.page_name + '). Revisa que sea la página correcta.');
  else if (metaForm.status !== 'ACTIVE') problemas.push('El formulario está ' + metaForm.status + ' en Meta (debe estar ACTIVE).');

  // 3) Leads que Meta tiene y el panel no
  if (metaForm) {
    const ml = await get('/' + formId + '/leads?fields=id,created_time&limit=100', token);
    if (err(ml)) problemas.push('No pude leer los leads de Meta: ' + err(ml));
    else {
      const ids = (ml.data || []).map(x => String(x.id));
      const enDB = ids.length ? await col.find({ leadgen_id: { $in: ids } }, { projection: { leadgen_id: 1 } }).toArray() : [];
      const set = new Set(enDB.map(x => x.leadgen_id));
      const faltan = ids.filter(i => !set.has(i));
      console.log('  Leads del formulario: en Meta ' + ids.length + ' | en Agentia ' + enDB.length + ' | FALTAN en el panel: ' + faltan.length);
      if (faltan.length) problemas.push('Faltan ' + faltan.length + ' leads de Meta en el panel (hay que recuperarlos)');
    }
  }

  // 4) Plan
  const nuevo = prev.map(f => ({ ...f, activo: String(f.formId) === String(formId) }));
  if (!nuevo.some(f => String(f.formId) === String(formId))) {
    nuevo.push({ formId: String(formId), formName: (metaForm && metaForm.name) || String(formId), plataforma: 'fb/ig', activo: true });
  }
  console.log('\nQuedaría así:');
  nuevo.forEach(f => console.log('  ', f.formId, '| activo:', f.activo, '|', f.formName || ''));

  if (problemas.length) console.log('\n⚠️  PROBLEMAS:\n   - ' + problemas.join('\n   - '));
  const bloqueantes = problemas.filter(p => /NO es válido|NO está suscrita|NO pertenece|está [A-Z]+ en Meta|subscribed_apps|leadgen_forms/.test(p));

  if (!APPLY) { console.log('\n(DRY-RUN: no se cambió nada. Agrega --apply para guardar.)'); return client.close(); }
  if (bloqueantes.length) stop('No apliqué el cambio por los problemas de arriba. Corrígelos y vuelve a correrlo.');

  await client.db(process.env.MONGODB_DB || 'agentia_chatbot_ventas').collection('client_reassign_backups').insertOne({ tipo: 'fix-forms', clientSlug: cli.clientSlug, resellerId, formulariosAntes: prev, fecha: new Date() });
  const r = await col.updateOne({ _id: cli._id }, { $set: { formularios: nuevo, updatedAt: new Date() } });
  console.log('\n✅ Guardado. Modificados:', r.modifiedCount, '(respaldo en client_reassign_backups)');
  client.close();
}).catch(e => { console.error(e.message || e); process.exit(1); });
