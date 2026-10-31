#!/usr/bin/env node
/**
 * seed-demo-agencia.js — crea una cuenta DEMO de revendedor con 3 clientes y leads de ejemplo
 * (todo ficticio) para grabar videos y mostrar el sistema sin datos reales.
 *
 *   node scripts/seed-demo-agencia.js              crea/actualiza la demo
 *   node scripts/seed-demo-agencia.js --remove     borra TODO lo de la demo
 *
 * Revendedor:  /portal/demo-agencia   (clave del revendedor: demo2026)
 * Clientes:    /portal/demo-agencia/cliente/<slug>  (clave: demo2026)
 *   - vida-seguros-demo, inmobiliaria-horizonte-demo, clinica-sonrisa-demo
 * Todo lleva es_demo:true. Variables: MONGODB_URI, MONGODB_DB (opcional).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const WA_COLS = ['wa_accounts', 'wa_messages', 'wa_conversations', 'wa_campaigns', 'wa_campaign_recipients'];

const RID = 'demo-agencia';
const PASS = 'demo2026';
const hash = (raw) => crypto.createHash('sha256').update(raw + 'reseller_pass_salt_2026').digest('hex');
const envVal = (k) => {
  for (const f of ['.env.local', '.env']) {
    const p = path.join(__dirname, '..', f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(new RegExp(`^${k}=(.+)$`, 'm'));
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
};

const NOMBRES = ['Ana Torres', 'Carlos Méndez', 'Lucía Ramírez', 'Jorge Castillo', 'María Fernández', 'Diego Herrera', 'Paola Vargas', 'Luis Ortega', 'Sofía Navarro', 'Andrés Salinas', 'Valeria Cruz', 'Ricardo Peña', 'Daniela Rojas', 'Miguel Ibarra', 'Fernanda Luna', 'Héctor Aguilar', 'Camila Soto', 'Raúl Delgado'];
const ESTADOS = ['en_seguimiento', 'en_seguimiento', 'en_seguimiento', 'contactado', 'contactado', 'interesado', 'cerrado', 'no_contesto', 'no_interesado'];

const CLIENTES = [
  { slug: 'vida-seguros-demo', nombre: 'Vida Seguros Demo', negocio: 'Seguros de vida y gastos médicos', form: 'Cotiza tu seguro de vida', campana: 'Seguros Vida — Octubre',
    campos: [['¿Qué tipo de seguro necesitas?', ['Seguro de vida', 'Gastos médicos', 'Seguro para mi familia']], ['¿Cuántas personas quieres asegurar?', ['1', '2', '3 o más']], ['¿Cuál es tu rango de edad?', ['25 a 35 años', '36 a 50 años', '51 a 65 años']]] },
  { slug: 'inmobiliaria-horizonte-demo', nombre: 'Inmobiliaria Horizonte Demo', negocio: 'Departamentos y terrenos', form: 'Quiero información de preventa', campana: 'Preventa Torre Horizonte',
    campos: [['¿Qué buscas?', ['Departamento', 'Terreno', 'Casa']], ['¿Cuál es tu presupuesto aproximado?', ['Hasta $2 millones', '$2 a $4 millones', 'Más de $4 millones']], ['¿Cómo piensas pagar?', ['Crédito hipotecario', 'Contado', 'Aún no lo sé']]] },
  { slug: 'clinica-sonrisa-demo', nombre: 'Clínica Sonrisa Demo', negocio: 'Odontología estética', form: 'Agenda tu valoración', campana: 'Valoración gratuita — Ortodoncia',
    campos: [['¿Qué tratamiento te interesa?', ['Ortodoncia', 'Blanqueamiento', 'Carillas', 'Limpieza']], ['¿Cuándo quieres tu cita?', ['Esta semana', 'Este mes', 'Solo cotizando']], ['¿Has tenido tratamiento antes?', ['Sí', 'No']]] },
];

const pick = (a, i) => a[i % a.length];

const CONVOS = [
  ['Ana Torres', 'Hola, sí me interesa, ¿cuánto cuesta?', 'Con gusto Ana. Te comparto las opciones en un momento, ¿te llamo hoy?', 0.4, true],
  ['Carlos Méndez', '¿Me pueden llamar mañana por la tarde?', 'Claro Carlos, quedamos mañana a las 5 pm. ¡Gracias!', 2.5, false],
  ['Lucía Ramírez', 'Gracias, ya recibí la información', 'Perfecto Lucía, cualquier duda aquí estamos.', 5, false],
  ['Jorge Castillo', 'Buenas, ¿tienen disponibilidad esta semana?', null, 1.2, true],
  ['María Fernández', 'Me llegó el mensaje, ¿pueden mandarme más detalles?', 'Te los envío ahora mismo, María.', 8, false],
  ['Diego Herrera', 'Ok, lo reviso y les aviso', null, 14, false],
];

async function seedWhatsApp(db, cl, idx, now) {
  const base = { resellerId: RID, clientSlug: cl.slug };
  const phoneId = `demo-phone-${cl.slug}`;
  for (const col of WA_COLS) {
    if (col === 'wa_campaign_recipients') continue;
    if (col === 'wa_campaigns') {
      const ids = (await db.collection(col).find(base, { projection: { _id: 1 } }).toArray()).map((x) => x._id);
      if (ids.length) await db.collection('wa_campaign_recipients').deleteMany({ campaignId: { $in: ids } });
    }
    await db.collection(col).deleteMany(base);
  }
  await db.collection('wa_accounts').insertOne({ ...base, wabaId: `demo-waba-${idx}`, phoneNumberId: phoneId, displayPhone: `+52 55 5550 0${100 + idx}`, verifiedName: cl.nombre, qualityRating: 'GREEN', tokenEnc: 'demo', registered: true, subscribed: true, status: 'connected', connectedAt: now, updatedAt: now, es_demo: true });

  let n = 0;
  const msgs = []; const convs = [];
  CONVOS.forEach(([name, inbound, outbound, hoursAgo], i) => {
    const phone = `5255550${String(1000 + idx * 20 + i)}`.slice(0, 12);
    const tIn = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    const tOut = new Date(tIn.getTime() - 40 * 60 * 1000);
    const m = (direction, text, at, extra = {}) => ({ ...base, phoneNumberId: phoneId, direction, wamid: `demo-${cl.slug}-${n++}`, contact: phone, contactKey: phone, text, type: 'text', createdAt: at, updatedAt: at, ...extra });
    msgs.push(m('out', `Hola ${name.split(' ')[0]}, recibimos tus datos en el formulario de ${cl.nombre}. En unos momentos un asesor te va a contactar. ¡Gracias por tu interés!`, tOut, { status: 'read', pricingCategory: 'utility', billable: true }));
    msgs.push(m('in', inbound, tIn));
    let lastText = inbound, lastDirection = 'in', lastAt = tIn;
    if (outbound) { const t = new Date(tIn.getTime() + 8 * 60 * 1000); msgs.push(m('out', outbound, t, { status: 'delivered', pricingCategory: 'service', billable: false })); lastText = outbound; lastDirection = 'out'; lastAt = t; }
    convs.push({ ...base, contactKey: phone, waId: phone, name, lastMessageAt: lastAt, lastText, lastDirection, lastInboundAt: tIn, unread: lastDirection === 'in' ? 1 + (i % 2) : 0, createdAt: tOut });
  });
  await db.collection('wa_conversations').insertMany(convs);

  const campId = new ObjectId();
  const created = new Date(now.getTime() - 26 * 3600 * 1000);
  await db.collection('wa_campaigns').insertOne({ _id: campId, ...base, name: 'Promo de octubre', templateName: 'promo_octubre_v1', language: 'es_MX', optInConfirmed: true, status: 'done', total: 30, createdAt: created, updatedAt: created });
  const recipients = []; const outs = [];
  for (let i = 0; i < 30; i++) {
    const phone = `5255551${String(2000 + idx * 40 + i)}`.slice(0, 12);
    const failed = i === 7 || i === 21;
    recipients.push({ campaignId: campId, phone, params: [NOMBRES[i % NOMBRES.length].split(' ')[0], cl.nombre], status: failed ? 'failed' : 'sent', ...(failed ? { error: 'Número sin WhatsApp' } : { wamid: `demo-camp-${cl.slug}-${i}`, sentAt: created }) });
    if (!failed) outs.push({ ...base, phoneNumberId: phoneId, direction: 'out', wamid: `demo-camp-${cl.slug}-${i}`, contact: phone, contactKey: phone, text: `Hola ${NOMBRES[i % NOMBRES.length].split(' ')[0]}, este mes tenemos una promoción especial en ${cl.nombre}.`, type: 'template', campaignId: campId.toHexString(), status: i % 4 === 0 ? 'delivered' : 'read', pricingCategory: 'marketing', billable: true, createdAt: created, updatedAt: created });
  }
  await db.collection('wa_campaign_recipients').insertMany(recipients);
  await db.collection('wa_messages').insertMany([...msgs, ...outs]);
  console.log(`    WhatsApp demo: ${convs.length} conversaciones, 1 campaña (30 contactos)`);
}
(async () => {
  const uri = process.env.MONGODB_URI || envVal('MONGODB_URI');
  if (!uri) throw new Error('No se encontro MONGODB_URI');
  const c = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = c.db(process.env.MONGODB_DB || envVal('MONGODB_DB') || 'agentia_chatbot_ventas');
  const leads = db.collection('leads');

  if (process.argv.includes('--remove')) {
    const r = await leads.deleteMany({ resellerId: RID });
    for (const col of WA_COLS) {
      if (col === 'wa_campaign_recipients') continue;
      const ids = col === 'wa_campaigns' ? (await db.collection(col).find({ resellerId: RID }, { projection: { _id: 1 } }).toArray()).map((x) => x._id) : [];
      if (ids.length) await db.collection('wa_campaign_recipients').deleteMany({ campaignId: { $in: ids } });
      await db.collection(col).deleteMany({ resellerId: RID });
    }
    console.log(`Borrados ${r.deletedCount} documentos de la demo (${RID}) y sus datos de WhatsApp.`);
    return c.close();
  }

  const now = new Date();
  await leads.updateOne(
    { _collection_type: 'reseller', resellerId: RID },
    { $set: { _collection_type: 'reseller', resellerId: RID, nombre: 'Agencia Demo', email: 'demo@agentia.software', passwordHash: hash(PASS), plan: 'pro', status: 'activo', brandName: 'Agentia', brandColor: '#22c55e', showPoweredBy: true, es_demo: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );

  let total = 0;
  for (const cl of CLIENTES) {
    await leads.updateOne(
      { _collection_type: 'reseller_client', resellerId: RID, clientSlug: cl.slug },
      { $set: { _collection_type: 'reseller_client', resellerId: RID, clientSlug: cl.slug, nombre: cl.nombre, negocio: cl.negocio, clientPasswordHash: hash(PASS), formularios: [{ formId: `demo-${cl.slug}`, formName: cl.form, plataforma: 'fb/ig', activo: true }], status: 'activo', pwa_enabled: true, addons: { whatsappApi: true, forms: false }, es_demo: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    await leads.deleteMany({ resellerId: RID, clientSlug: cl.slug, _collection_type: { $ne: 'reseller_client' } });
    const docs = [];
    for (let i = 0; i < 16; i++) {
      const nombre = pick(NOMBRES, i + CLIENTES.indexOf(cl) * 5);
      const horas = i === 0 ? 0.3 : i * 3.2 + (i % 3);
      const createdAt = new Date(now.getTime() - horas * 3600 * 1000);
      const tel = `521555500${String(100 + i + CLIENTES.indexOf(cl) * 20).padStart(4, '0')}`.slice(0, 13);
      const form_fields = {};
      cl.campos.forEach(([q, opts]) => { form_fields[q] = pick(opts, i + q.length); });
      const status = i === 0 ? 'en_seguimiento' : pick(ESTADOS, i);
      docs.push({
        leadId: `demo_${cl.slug}_${i}`, clientId: 'agentia-ventas', senderName: nombre, nombre, telefono: tel,
        email: `${nombre.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}@ejemplo.com`,
        platform: 'facebook', source: 'facebook', source_meta: true, canal_origen: 'fb-ads',
        campana: cl.campana, form_id: `demo-${cl.slug}`, form_name: cl.form, page_name: cl.nombre, platform_src: i % 2 ? 'ig' : 'fb',
        form_fields, resellerId: RID, clientSlug: cl.slug, es_demo: true,
        status: 'nuevos', status_vendedor: 'nuevo', status_seguimiento: status, bot_status: 'active', messageCount: 1,
        lastMessage: `Lead desde FB Ads — ${cl.campana}`, lastMessageAt: createdAt, tags: ['fb-ads'], createdAt, updatedAt: createdAt,
      });
    }
    await leads.insertMany(docs);
    total += docs.length;
    await seedWhatsApp(db, cl, CLIENTES.indexOf(cl), now);
    console.log(`  ${cl.nombre}: ${docs.length} leads  ->  /portal/${RID}/cliente/${cl.slug}`);
  }
  console.log(`\nListo. Revendedor: /portal/${RID}  |  clave: ${PASS}  |  ${total} leads de ejemplo.`);
  console.log('Para borrar todo: node scripts/seed-demo-agencia.js --remove');
  await c.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
