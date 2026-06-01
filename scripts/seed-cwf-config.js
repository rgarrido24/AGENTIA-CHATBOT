const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Load env vars from .env.local / .env (dotenv not available as global dep)
function readEnvFile(filename) {
  const p = path.join(__dirname, '..', filename);
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs.readFileSync(p, 'utf8').split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]; })
  );
}
const env = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
const MONGODB_URI = process.env.MONGODB_URI || env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI no encontrada en .env.local ni en variables de entorno'); process.exit(1); }

const model = 'gemini-2.0-flash';

// Reemplazar con el system prompt y knowledge definitivos (ver chat / operación update:cwf).
const systemPrompt = `Eres el asistente virtual de CWF. Responde en español, tono profesional y cercano.`;

const knowledge = `Base de conocimiento CWF — actualizar con la información operativa del negocio.`;

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const result = await db.collection('business_configs').updateOne(
    { clientId: 'cwf' },
    { $set: { systemPrompt, knowledge, model, updatedAt: new Date() } }
  );
  console.log(result.modifiedCount === 1 ? '✅ Actualizado OK' : '⚠️ Sin cambios (documento idéntico o no existe)');
  await client.close();
}

main().catch(console.error);
