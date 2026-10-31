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
const { MongoClient } = require('mongodb');

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
(async () => {
  const uri = process.env.MONGODB_URI || envVal('MONGODB_URI');
  if (!uri) throw new Error('No se encontro MONGODB_URI');
  const c = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = c.db(process.env.MONGODB_DB || envVal('MONGODB_DB') || 'agentia_chatbot_ventas');
  const leads = db.collection('leads');

  if (process.argv.includes('--remove')) {
    const r = await leads.deleteMany({ resellerId: RID });
    console.log(`Borrados ${r.deletedCount} documentos de la demo (${RID}).`);
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
      { $set: { _collection_type: 'reseller_client', resellerId: RID, clientSlug: cl.slug, nombre: cl.nombre, negocio: cl.negocio, clientPasswordHash: hash(PASS), formularios: [{ formId: `demo-${cl.slug}`, formName: cl.form, plataforma: 'fb/ig', activo: true }], status: 'activo', pwa_enabled: true, es_demo: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
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
    console.log(`  ${cl.nombre}: ${docs.length} leads  ->  /portal/${RID}/cliente/${cl.slug}`);
  }
  console.log(`\nListo. Revendedor: /portal/${RID}  |  clave: ${PASS}  |  ${total} leads de ejemplo.`);
  console.log('Para borrar todo: node scripts/seed-demo-agencia.js --remove');
  await c.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
