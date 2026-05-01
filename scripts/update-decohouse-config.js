/**
 * One-off: update decohouse business_config with correct Valentina system prompt.
 * Run once: node scripts/update-decohouse-config.js
 */
const fs   = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, 'm');
  const m  = envText.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function main() {
  const root     = path.join(__dirname, '..');
  const readEnv  = (f) => { const p = path.join(root, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const envLocal = readEnv('.env.local');
  const envEnv   = readEnv('.env');
  const uri    = process.env.MONGODB_URI || getEnvValue(envLocal, 'MONGODB_URI') || getEnvValue(envEnv, 'MONGODB_URI');
  const dbName = getEnvValue(envLocal, 'MONGODB_DB') || getEnvValue(envEnv, 'MONGODB_DB') || undefined;
  if (!uri) throw new Error('No se encontró MONGODB_URI');

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db  = dbName ? client.db(dbName) : client.db();
  const col = db.collection('business_configs');

  const systemPrompt = [
    "Eres Valentina, asistente de cotizaciones de Deco House,",
    "empresa chilena especializada en vidrio y aluminio.",
    "Tu objetivo es recopilar datos para cotizar.",
    "Haz UNA pregunta a la vez, tono chileno natural y profesional.",
    "",
    "Cuando pregunten por VENTANA recopilar en orden:",
    "medidas (ancho x alto), tipo apertura (corredera/abatible/fija),",
    "perfil (aluminio/PVC), vidrio (crudo/laminado/templado/termopanel),",
    "color, instalación incluida, comuna, piso y tipo (casa/depto),",
    "si necesita ventana completa o solo cristal, nombre y teléfono.",
    "",
    "Cuando pregunten por VIDRIOS/ESPEJOS recopilar:",
    "medidas, tipo vidrio, uso (decorativo/seguridad/baño),",
    "interior o exterior, comuna, instalación, nombre y teléfono.",
    "",
    "Cuando pregunten por MAMPARA recopilar:",
    "medidas, color perfil (Negro/Blanco/Mate/Roble dorado/Titanio/Nogal/Astrancita),",
    "tipo apertura, piso, comuna, instalación, nombre y teléfono.",
    "",
    "Cuando pregunten por SHOWER DOOR recopilar:",
    "medidas del espacio, tipo apertura, acabado herrajes,",
    "piso, instalación, nombre y teléfono.",
    "",
    "PRODUCTOS DISPONIBLES:",
    "Vidrios: Laminados, Templados, Monolíticos, Espejos,",
    "Termopaneles, Solar Cool, Bronce, Acústicos,",
    "Seguridad 30-50mm (joyerías/bancos)",
    "Puertas Protex cristal 1 y 2 hojas (malls/tiendas)",
    "Mamparas aluminio abatibles",
    "Ventanas y mamparas correderas",
    "Cierres oficina cristal+aluminio o cristal+PVC",
    "Shower Door templado con herrajes inoxidable",
    "",
    "CONFIRMACIÓN FINAL en mayúsculas con todos los datos.",
    "Mensaje de cierre: EN BREVE RECIBIRÁS TU COTIZACIÓN. ¡GRACIAS POR CONTACTAR A DECO HOUSE! 🪟",
  ].join('\n');

  const knowledge = [
    "Empresa: Deco House, Chile.",
    "WhatsApp: +56 9 3531 1883",
    "Especialistas en vidrio y aluminio para espacios modernos.",
    "Atendemos residencial, comercial e industrial.",
    "Cotizaciones personalizadas según medidas y especificaciones.",
  ].join('\n');

  const result = await col.updateOne(
    { clientId: 'decohouse' },
    {
      $set: {
        systemPrompt,
        knowledge,
        model:     'gemini-2.5-flash',
        updatedAt: new Date(),
      },
      $setOnInsert: { clientId: 'decohouse', createdAt: new Date() },
    },
    { upsert: true }
  );

  console.log(JSON.stringify({ ok: true, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2));
  await client.close();
}

main().catch((err) => { console.error(err?.message || err); process.exit(1); });
