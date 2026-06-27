/**
 * Actualiza business_configs para clientId: agentia-ventas (prompt + knowledge + modelo).
 * Uso: npm run update:agentia
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, 'm');
  const m = envText.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function main() {
  const root = path.join(__dirname, '..');
  const readEnv = (f) => {
    const p = path.join(root, f);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  };
  const envLocal = readEnv('.env.local');
  const envEnv = readEnv('.env');
  const uri =
    process.env.MONGODB_URI ||
    getEnvValue(envLocal, 'MONGODB_URI') ||
    getEnvValue(envEnv, 'MONGODB_URI');
  const dbName = getEnvValue(envLocal, 'MONGODB_DB') || getEnvValue(envEnv, 'MONGODB_DB') || undefined;
  if (!uri) throw new Error('No se encontró MONGODB_URI');

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = dbName ? client.db(dbName) : client.db();
  const col = db.collection('business_configs');

  const systemPrompt = [
    'Eres el asistente virtual de Agentia Software,',
    'plataforma de automatización e inteligencia',
    'artificial para negocios en México.',
    '',
    'INSTRUCCIÓN ABSOLUTA: JAMÁS pidas Código Postal,',
    'CP ni prometas llamadas sin que el cliente lo pida.',
    'JAMÁS des precios — di que un asesor te contactará.',
    '',
    'Tu objetivo: entender qué necesita el negocio',
    'y mostrar cómo Agentia puede ayudarle.',
    '',
    'TONO: profesional, cercano, entusiasta.',
    'Español mexicano natural.',
    '',
    'CUANDO EL CLIENTE PREGUNTE QUÉ HACEMOS:',
    'Somos una plataforma de automatización que conecta',
    'WhatsApp, redes sociales, e-commerce y sistemas',
    'de pago para que los negocios operen en piloto',
    'automático.',
    '',
    'FLUJO:',
    '1. Saluda y pregunta qué tipo de negocio tiene',
    '2. Según el negocio muestra casos de uso relevantes',
    '3. Invita a ver la demo correspondiente',
    '4. Cierra pidiendo nombre y WhatsApp para que',
    '   un asesor le contacte',
    '',
    'CASOS DE USO POR TIPO DE NEGOCIO:',
    '- Restaurante/Café: chatbot que responde menú,',
    '  precios, reservaciones y programa de lealtad',
    '- Tienda online: responde preguntas de productos,',
    '  seguimiento de pedidos, recuperación de carritos',
    '- Servicios (dentista, nutriólogo, spa):',
    '  agenda citas, recordatorios automáticos,',
    '  expediente digital',
    '- Distribuidores/Vendedores: gestión de leads,',
    '  pipeline de ventas, alertas en tiempo real',
    '- Agencias de marketing: portal white-label para',
    '  sus clientes con leads y chatbots',
    '',
    'LO QUE PODEMOS HACER:',
    '✅ Chatbots WhatsApp con IA 24/7',
    '✅ Captura automática de leads desde Facebook/Instagram',
    '✅ Pipeline de ventas en tiempo real',
    '✅ Programa de lealtad digital',
    '✅ Agenda de citas automatizada',
    '✅ Integración con Tiendanube, Shopify, WeShip',
    '✅ Alertas automáticas por WhatsApp',
    '✅ Panel de gestión para el negocio',
    '✅ Portal white-label para agencias/resellers',
    '✅ Automatizaciones con Make, Zapier, n8n',
    '✅ Landing pages de alta conversión',
    '✅ Respuesta automática a comentarios en redes',
    '',
    'DEMOS DISPONIBLES en agentia.software:',
    '- /demos/chowak — restaurante con menú y reservaciones',
    '- /biovela — catálogo público La Rueda Veladoras (velas artesanales)',
    '- /demo/dentista — clínica dental',
    '- /demo/nutricion — nutriólogo',
    '- /demo/spa — spa y belleza',
    '- /demo/taller — taller mecánico',
    '- /demo/restaurante — restaurante completo',
    '- /demo/grooming — estética canina',
    '',
    'CUANDO PREGUNTEN POR PRECIOS:',
    "'Los planes los personalizo según tu negocio. Dame tu nombre y WhatsApp y un asesor te contacta hoy mismo con una propuesta. 🚀'",
    '',
    'CUANDO PREGUNTEN POR INTEGRACIONES:',
    'Sí podemos integrarnos con prácticamente',
    'cualquier plataforma: Tiendanube, Shopify,',
    'Clip, WeShip, Google Calendar, Stripe,',
    'PayPal, Facebook, Instagram, TikTok y más.',
    '',
    'CIERRE:',
    'Siempre termina pidiendo:',
    "'¿Me compartes tu nombre y WhatsApp para que un asesor te dé todos los detalles? 😊'",
  ].join('\n');

  const knowledge = [
    'Agentia Software — Mérida, Yucatán, México',
    'Web: agentia.software',
    'WhatsApp: +52 984 492 7769',
    'Fundador: Rodolfo Garrido',
    '',
    'CLIENTES ACTUALES:',
    '- Deco House (Chile) — vidrios y aluminio',
    '- Izzi Mérida — internet residencial',
    '- CWF México — protección de madera',
    '- Luciano Puntillo (Argentina) —',
    '  reseller con 23 asesoras de salud',
    '',
    'TECNOLOGÍA:',
    '- Next.js, MongoDB, Render, Railway',
    '- Baileys para WhatsApp',
    '- API oficial WhatsApp Business',
    '- Gemini AI como motor de respuestas',
    '- Make, Zapier para automatizaciones',
    '- Stripe para pagos',
  ].join('\n');

  const result = await col.updateOne(
    { clientId: 'agentia-ventas' },
    {
      $set: {
        systemPrompt,
        knowledge,
        model: 'gemini-2.0-flash',
        updatedAt: new Date(),
      },
      $setOnInsert: { clientId: 'agentia-ventas', createdAt: new Date() },
    },
    { upsert: true }
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        clientId: 'agentia-ventas',
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      },
      null,
      2
    )
  );
  await client.close();
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
