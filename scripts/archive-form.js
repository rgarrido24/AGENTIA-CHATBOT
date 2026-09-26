/**
 * Archiva un formulario de Facebook Lead Ads vía Graph API y lo marca
 * activo:false en Mongo (reseller_client.formularios).
 *
 * Uso (Render Web Shell / local):
 *   node scripts/archive-form.js <clientSlug> <formId>
 *   node scripts/archive-form.js <clientSlug> <formId> <resellerId>
 *
 * Default resellerId = luciano
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const GRAPH_VERSION = 'v21.0';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function getEnvValue(envText, key) {
  const re = new RegExp(`^${key}=(.+)$`, 'm');
  const m = envText.match(re);
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

function loadEnv() {
  const root = path.join(__dirname, '..');
  const read = (f) => {
    const p = path.join(root, f);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  };
  const local = read('.env.local');
  const env = read('.env');
  const pick = (key) =>
    process.env[key] || getEnvValue(local, key) || getEnvValue(env, key) || '';
  return {
    uri: pick('MONGODB_URI'),
    dbName: pick('MONGODB_DB') || undefined,
    encKey: pick('FB_TOKEN_ENCRYPTION_KEY') || pick('FB_APP_SECRET'),
  };
}

function decryptFbToken(packed, encKey) {
  if (!encKey) throw new Error('Falta FB_TOKEN_ENCRYPTION_KEY o FB_APP_SECRET');
  const parts = String(packed || '').split(':');
  if (parts.length !== 3) throw new Error('Token cifrado inválido (se esperaba iv:tag:ciphertext)');
  const [ivH, tagH, dataH] = parts;
  const key = crypto.createHash('sha256').update(encKey).digest();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivH, 'hex'));
  decipher.setAuthTag(Buffer.from(tagH, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataH, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

async function main() {
  const [, , clientSlug, formId, resellerArg] = process.argv;
  if (!clientSlug || !formId) {
    console.error('Uso: node scripts/archive-form.js <clientSlug> <formId> [resellerId]');
    process.exit(1);
  }
  const resellerId = (resellerArg || 'luciano').trim();
  const env = loadEnv();
  if (!env.uri) throw new Error('No se encontró MONGODB_URI');

  const mongo = new MongoClient(env.uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 });
  await mongo.connect();
  const db = env.dbName ? mongo.db(env.dbName) : mongo.db();

  const client = await db.collection('leads').findOne({
    _collection_type: 'reseller_client',
    resellerId,
    clientSlug,
  });
  if (!client) {
    console.error(`No se encontró reseller_client ${resellerId}/${clientSlug}`);
    await mongo.close();
    process.exit(1);
  }

  const packed = client.fb_connection?.page_access_token;
  if (!packed || client.fb_connection?.status !== 'connected') {
    console.error(`El cliente ${clientSlug} no tiene fb_connection.page_access_token (status=${client.fb_connection?.status || 'ninguno'})`);
    await mongo.close();
    process.exit(1);
  }

  let pageToken;
  try {
    pageToken = decryptFbToken(packed, env.encKey);
  } catch (err) {
    console.error('No se pudo descifrar el page token:', err.message);
    await mongo.close();
    process.exit(1);
  }

  const pageId = client.fb_connection?.page_id || '';
  const formInDb = (client.formularios || []).find((f) => String(f.formId) === String(formId));
  console.log(JSON.stringify({
    paso: 'cliente',
    resellerId,
    clientSlug,
    nombre: client.nombre,
    pageId,
    pageName: client.fb_connection?.page_name || null,
    formEnMongo: formInDb
      ? { formId: formInDb.formId, formName: formInDb.formName, activo: formInDb.activo }
      : null,
  }, null, 2));

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(formId)}` +
    `?status=ARCHIVED` +
    `&access_token=${encodeURIComponent(pageToken)}`;
  console.log(`[archive-form] POST Graph ${GRAPH_VERSION}/${formId}?status=ARCHIVED`);
  const res = await fetch(url, { method: 'POST' });
  const json = await res.json().catch(() => ({ parse_error: true, http: res.status }));
  const graphOk = res.ok && !json.error && json.success !== false;
  console.log(JSON.stringify({
    paso: 'graph',
    http: res.status,
    ok: graphOk,
    respuesta: json,
  }, null, 2));

  if (!graphOk) {
    const msg = json.error?.error_user_msg || json.error?.message || `Graph HTTP ${res.status}`;
    console.error('Graph API falló. El formulario NO se marcó inactivo en Mongo.');
    console.error(msg);
    if (String(msg).toLowerCase().includes('pages_manage_ads') || json.error?.code === 200) {
      console.error('Pista: el page token puede no tener pages_manage_ads. Reconectá el cliente aceptando ese permiso.');
    }
    await mongo.close();
    process.exit(1);
  }

  const upd = await db.collection('leads').updateOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    {
      $set: {
        'formularios.$[f].activo': false,
        updatedAt: new Date(),
      },
    },
    { arrayFilters: [{ 'f.formId': String(formId) }] },
  );

  console.log(JSON.stringify({
    paso: 'mongo',
    matched: upd.matchedCount,
    modified: upd.modifiedCount,
    formId,
    activo: false,
  }, null, 2));

  if (upd.modifiedCount === 0) {
    console.warn('Graph archivó el form, pero Mongo no modificó formularios[] (¿formId distinto al guardado?).');
  } else {
    console.log(`OK: formulario ${formId} archivado en Meta y activo:false en ${resellerId}/${clientSlug}`);
  }

  await mongo.close();
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
