/**
 * WhatsApp - Hard Reset de sesión
 *
 * Elimina carpetas de autenticación y el QR guardado en MongoDB.
 * Útil cuando la sesión está corrupta o "Intenta de nuevo más tarde".
 *
 * Uso: node scripts/whatsapp-reset-session.js
 *
 * IMPORTANTE: Detén el WhatsApp Bridge (Ctrl+C) antes de ejecutar este script.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function getEnv(key, def) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    const re = new RegExp(`^${key}=(.+)$`, 'm');
    const m = text.match(re);
    if (m) {
      let v = m[1].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return v || def;
    }
  }
  return process.env[key] || def;
}

const rootDir = path.join(__dirname, '..');

function findSessionFolders() {
  const folders = [];
  if (!fs.existsSync(rootDir)) return folders;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && (e.name.startsWith('.wwebjs') || e.name === 'auth_info_baileys' || e.name === 'auth_info' || e.name === 'baileys_auth_info' || e.name === 'session')) {
      folders.push(path.join(rootDir, e.name));
    }
  }
  return folders;
}

async function clearMongoQR() {
  const uri = getEnv('MONGODB_URI', '');
  const dbName = getEnv('MONGODB_DB', '');
  if (!uri) return false;
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = dbName ? client.db(dbName) : client.db();
    const result = await db.collection('whatsapp_qr').deleteOne({ _id: 'current' });
    await client.close();
    return result.deletedCount > 0;
  } catch (err) {
    console.error('  ✗ MongoDB:', err.message);
    return false;
  }
}

async function main() {
  console.log('[Agentia] WhatsApp Hard Reset - Limpieza completa\n');

  // 1. Carpetas de sesión (busca dinámicamente)
  const foldersToDelete = findSessionFolders();
  let deleted = 0;
  for (const dir of foldersToDelete) {
    const name = path.basename(dir);
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✓ Eliminado: ${name}`);
      deleted++;
    } catch (err) {
      console.error(`  ✗ Error eliminando ${name}:`, err.message);
      console.log(`    Ruta manual: ${dir}`);
    }
  }

  if (deleted === 0) {
    console.log('  (No había carpetas de sesión locales)');
  }

  // 2. QR guardado en MongoDB
  const mongoCleared = await clearMongoQR();
  if (mongoCleared) {
    console.log('  ✓ QR anterior eliminado de MongoDB');
  } else {
    console.log('  (MongoDB: sin cambios o no configurado)');
  }

  console.log('\n[Agentia] Reset completado.');
  console.log('\nSiguiente paso: ejecuta "npm run whatsapp" para generar un nuevo QR.');
  console.log('\nSi WhatsApp sigue diciendo "Intenta de nuevo más tarde",');
  console.log('es una restricción de tu cuenta. Prueba con otro número.');
}

main().catch(console.error);
