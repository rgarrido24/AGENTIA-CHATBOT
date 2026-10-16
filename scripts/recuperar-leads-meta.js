const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const APPLY = process.env.APPLY === '1';
const SLUG = process.argv[2];
const FORM = process.argv[3];
if (!SLUG || !FORM) { console.log('Uso: npm run recuperar:leads -- <clientSlug> <formId>   (APPLY=1 para insertar)'); process.exit(0); }
const GRAPH = 'https://graph.facebook.com/v21.0';

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
function normPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('549')) return d;
  if (d.startsWith('54')) return '549' + d.slice(2);
  if (d.length === 10) return '549' + d;
  return d;
}
const STANDARD = new Set(['full_name', 'nombre_completo', 'name', 'phone_number', 'telefono', 'phone', 'email', 'correo']);

async function fetchAll(token) {
  let url = GRAPH + '/' + FORM + '/leads?fields=id,created_time,field_data,ad_name,adset_name,campaign_name,is_organic,platform&limit=100';
  const out = [];
  for (let n = 0; url && n < 20; n++) {
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    const j = await r.json();
    if (j.error) throw new Error('Graph #' + j.error.code + ' ' + String(j.error.message).slice(0, 200));
    out.push(...(j.data || []));
    url = j.paging && j.paging.next ? j.paging.next : null;
  }
  return out;
}

MongoClient.connect(process.env.MONGODB_URI).then(async client => {
  const col = client.db('agentia_chatbot_ventas').collection('leads');
  const cli = await col.findOne({ clientSlug: SLUG, _collection_type: 'reseller_client' });
  const fb = (cli && cli.fb_connection) || {};
  if (!cli) { console.log('ABORTO: no existe el cliente ' + SLUG); client.close(); return; }
  if (!fb.page_access_token || !fb.page_id) { console.log('ABORTO: sin token/page'); client.close(); return; }
  const PAGE = String(fb.page_id);
  const metaLeads = await fetchAll(dec(fb.page_access_token));
  console.log('Leads en Meta para el formulario:', metaLeads.length);

  const docs = metaLeads.map(L => {
    const fd = {};
    (L.field_data || []).forEach(x => { if (x && x.name && x.values && x.values[0]) fd[x.name] = x.values[0]; });
    const nombre = fd.full_name || fd.nombre_completo || fd.name || fd.nombre ||
      [fd.first_name, fd.last_name].filter(Boolean).join(' ') || '';
    const telKey = ['phone_number','whatsapp_number','telefono','phone','whatsapp','numero_de_whatsapp','celular'].find(k => fd[k]) ||
      Object.keys(fd).find(k => /phone|tel|whats|celu|numero|number/i.test(k) && /\d{6,}/.test(String(fd[k])));
    const telRaw = telKey ? fd[telKey] : '';
    const tel = normPhone(telRaw);
    const form_fields = {};
    Object.keys(fd).forEach(k => { if (!STANDARD.has(k)) form_fields[k] = fd[k]; });
    const fecha = new Date(L.created_time);
    const campana = L.campaign_name || '';
    return {
      leadId: (tel || 'fb_' + L.id) + '_' + PAGE + '_agentia-ventas',
      adset: L.adset_name || '', bot_status: 'active', campana, canal_origen: 'fb-ads',
      clientId: 'agentia-ventas', clientSlug: SLUG, createdAt: fecha, email: fd.email || fd.correo || '',
      form_fields, form_id: FORM, lastMessage: 'Lead desde FB Ads - ' + campana, lastMessageAt: fecha,
      leadgen_id: String(L.id), messageCount: 1, nombre, pageId: PAGE, pipeline: 'agentia',
      platform: 'facebook', resellerId: cli.resellerId || 'luciano', senderId: tel, senderName: nombre,
      source: 'facebook', source_meta: true, status: 'nuevos', status_vendedor: 'nuevo',
      tags: ['fb-ads', campana].filter(Boolean), telefono: tel, updatedAt: fecha, recuperado_manual: true,
      ...(nombre.startsWith('@') ? { nombre_es_usuario_ig: true } : {}),
      _tel_original: telRaw
    };
  });

  const ids = docs.map(d => d.leadgen_id), lids = docs.map(d => d.leadId);
  const ya = await col.find({ $or: [{ leadgen_id: { $in: ids } }, { leadId: { $in: lids } }] }, { projection: { leadgen_id: 1, leadId: 1, clientSlug: 1 } }).toArray();
  const yaI = new Set(ya.map(x => x.leadgen_id)), yaL = new Set(ya.map(x => x.leadId));
  const nuevos = docs.filter(d => !yaI.has(d.leadgen_id) && !yaL.has(d.leadId));
  console.log('Ya existentes (se saltean):', docs.length - nuevos.length, '| a insertar:', nuevos.length);
  if (ya.length) console.log('Existentes:', JSON.stringify(ya));

  docs.sort((a, b) => a.createdAt - b.createdAt).forEach(d =>
    console.log(' ', d.createdAt.toISOString().slice(0, 16), '|', (d.nombre || '(sin nombre)').padEnd(26), '|', String(d._tel_original || '(sin tel)').padEnd(15), '->', d.telefono || '(sin tel)'));
  if (nuevos[0]) { const ej = Object.assign({}, nuevos[0]); delete ej._tel_original; console.log('Ejemplo:', JSON.stringify(ej, null, 2)); }

  if (!APPLY) { console.log('\nENSAYO: no se escribio nada. Para insertar: APPLY=1 npm run recuperar:leads -- ' + SLUG + ' ' + FORM + ''); client.close(); return; }
  if (!nuevos.length) { console.log('Nada para insertar'); client.close(); return; }
  const aInsertar = nuevos.map(d => { const c = Object.assign({}, d); delete c._tel_original; return c; });
  const res = await col.insertMany(aInsertar, { ordered: false });
  console.log('INSERTADOS:', res.insertedCount, '| leads del cliente ahora:', await col.countDocuments({ clientSlug: SLUG, _collection_type: { $ne: 'reseller_client' } }));
  client.close();
});
