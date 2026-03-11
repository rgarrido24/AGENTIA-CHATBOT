/**
 * Diagnóstico: por qué el chat de Izzi no responde
 *
 * Verifica:
 * 1. business_configs tiene un documento con clientId "izzi"
 * 2. bot_settings NO tiene globalPaused para "izzi"
 * 3. (Opcional) Variables que debe tener el puente en Render
 *
 * Uso: node scripts/check-izzi-chat.js
 * Requiere MONGODB_URI en .env o .env.local (o variable de entorno).
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getEnv(key) {
  const root = path.join(__dirname, '..');
  for (const file of ['.env.local', '.env']) {
    const p = path.join(root, file);
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf8');
      const m = text.match(new RegExp(`^${key}=(.+)$`, 'm'));
      if (m) {
        let v = m[1].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v) return v;
      }
    }
  }
  return process.env[key] || '';
}

async function main() {
  const uri = getEnv('MONGODB_URI').trim();
  const dbName = getEnv('MONGODB_DB').trim() || undefined;

  console.log('\n=== Diagnóstico Chat Izzi ===\n');

  if (!uri) {
    console.log('❌ MONGODB_URI no encontrada en .env, .env.local ni en el entorno.');
    console.log('   En local: añade MONGODB_URI a .env.local para poder verificar MongoDB.');
    console.log('\n--- Checklist manual (Render) ---');
    console.log('1. En el Background Worker del puente (Izzi) debe estar:');
    console.log('   AGENTIA_WHATSAPP_CLIENT_ID=izzi');
    console.log('   AGENTIA_CHATBOT_API_URL=https://agentia-chatbot-ventas.onrender.com');
    console.log('2. En MongoDB Atlas, colección business_configs: debe existir un documento con clientId: "izzi".');
    console.log('   Si no existe: ejecuta "node scripts/seed-business-configs.js" (con MONGODB_URI en .env).');
    console.log('3. En MongoDB Atlas, colección bot_settings: no debe haber un documento con clientId "izzi" y globalPaused: true.');
    console.log('');
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
  } catch (e) {
    console.log('❌ No se pudo conectar a MongoDB:', e.message);
    console.log('   Revisa MONGODB_URI (IP permitida en Atlas, usuario/contraseña).');
    process.exit(1);
  }

  const db = dbName ? client.db(dbName) : client.db();
  const issues = [];
  const ok = [];

  // 1. business_configs para izzi
  const config = await db.collection('business_configs').findOne({
    clientId: { $in: ['izzi', 'IZZI'] },
  });
  if (!config) {
    issues.push('No existe config para clientId "izzi" en business_configs. El API devuelve 404 y el puente no puede obtener respuesta.');
    issues.push('  → Solución: ejecuta "node scripts/seed-business-configs.js" (con MONGODB_URI en .env).');
  } else {
    ok.push('business_configs tiene documento para izzi.');
  }

  // 2. bot_settings globalPaused para izzi
  const botSetting = await db.collection('bot_settings').findOne({
    clientId: 'izzi',
  });
  if (botSetting && botSetting.globalPaused === true) {
    issues.push('El bot está PAUSADO globalmente para "izzi" (bot_settings.globalPaused = true). El API no devuelve respuesta.');
    issues.push('  → Solución: en el dashboard o vía API, despausar el bot para clientId izzi.');
  } else {
    ok.push('Bot no está pausado para izzi (o no hay documento en bot_settings).');
  }

  await client.close();

  if (ok.length) {
    console.log('✅');
    ok.forEach((line) => console.log('  ', line));
    console.log('');
  }
  if (issues.length) {
    console.log('❌ Problemas encontrados:');
    issues.forEach((line) => console.log('  ', line));
    console.log('');
  }

  console.log('--- Variables del puente en Render (Background Worker Izzi) ---');
  console.log('  AGENTIA_WHATSAPP_CLIENT_ID=izzi');
  console.log('  AGENTIA_CHATBOT_API_URL=https://agentia-chatbot-ventas.onrender.com  (o tu URL del Web Service)');
  console.log('  MONGODB_URI=... (si el puente usa MongoDB)');
  console.log('  GEMINI_API_KEY no es necesario en el puente; lo usa el Web Service.');
  console.log('');

  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
