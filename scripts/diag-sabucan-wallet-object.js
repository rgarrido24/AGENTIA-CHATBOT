/**
 * Diagnóstico: arma el loyaltyObject exactamente como POST /api/wallet/sabucan
 * usando un cliente real de sabucan_clientes.
 *
 * Uso: node scripts/diag-sabucan-wallet-object.js
 */
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv('.env.local');
loadEnv('.env');

function formatPuntos(n) {
  const x = Math.round(Number(n) * 10) / 10;
  return x.toFixed(1);
}

function sabucanClassId(issuerId) {
  return `${issuerId}.sabucan_lealtad`;
}

function sabucanObjectId(issuerId, clienteId) {
  const safe = String(clienteId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${issuerId}.sabucan-${safe}`;
}

(async () => {
  const { MongoClient, ObjectId } = require('mongodb');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Falta MONGODB_URI');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'agentia_chatbot_ventas');
  const doc = await db.collection('sabucan_clientes').findOne({}, { sort: { updated_at: -1 } });
  await client.close();

  if (!doc) {
    console.error('No hay clientes en sabucan_clientes');
    process.exit(1);
  }

  const issuerId = (process.env.GOOGLE_WALLET_ISSUER_ID || '').trim() || 'ISSUER_ID_NO_CONFIGURADO';
  const hasSa = Boolean((process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON || '').trim());

  const clienteId = String(doc._id);
  const clienteNombre = String(doc.nombreCompleto || doc.nombre || '').trim();
  const telefono = String(doc.telefono || '').trim();
  const puntosActuales = Number(doc.puntos ?? 0);

  const loyaltyObject = {
    id: sabucanObjectId(issuerId, clienteId),
    classId: sabucanClassId(issuerId),
    state: 'ACTIVE',
    accountName: clienteNombre,
    accountId: telefono,
    barcode: {
      type: 'QR_CODE',
      value: telefono,
      alternateText: telefono,
    },
    loyaltyPoints: {
      label: 'Puntos',
      balance: { string: formatPuntos(Math.max(0, puntosActuales)) },
    },
    textModulesData: [
      { header: 'Cómo acumular', body: '1 punto por cada $100 MXN de compra' },
    ],
  };

  const claims = {
    iss: hasSa ? '(service_account.client_email desde env)' : '(SIN GOOGLE_WALLET_SERVICE_ACCOUNT_JSON LOCAL)',
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: { loyaltyObjects: [loyaltyObject] },
  };

  console.log('=== Cliente Mongo (prueba) ===');
  console.log(
    JSON.stringify(
      {
        _id: clienteId,
        nombre: clienteNombre,
        telefono,
        puntos: puntosActuales,
      },
      null,
      2,
    ),
  );

  console.log('\n=== Checks barcode ===');
  console.log('barcode exact shape:', JSON.stringify(loyaltyObject.barcode));
  console.log('value empty?', loyaltyObject.barcode.value === '');
  console.log('value length:', loyaltyObject.barcode.value.length);
  console.log('value typeof:', typeof loyaltyObject.barcode.value);

  console.log('\n=== Checks loyaltyPoints.balance ===');
  console.log('balance:', JSON.stringify(loyaltyObject.loyaltyPoints.balance));
  console.log('balance.string typeof:', typeof loyaltyObject.loyaltyPoints.balance.string);
  console.log('is "X.X" pattern?', /^\d+\.\d$/.test(loyaltyObject.loyaltyPoints.balance.string));

  console.log('\n=== Env Wallet local ===');
  console.log('GOOGLE_WALLET_ISSUER_ID set?', Boolean((process.env.GOOGLE_WALLET_ISSUER_ID || '').trim()));
  console.log('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON set?', hasSa);
  console.log('(Render: revisar panel Environment — no accesible desde aquí)');

  console.log('\n=== loyaltyObject completo (antes de firmar JWT) ===');
  console.log(JSON.stringify(loyaltyObject, null, 2));

  console.log('\n=== claims completos (antes de firmar JWT) ===');
  console.log(JSON.stringify(claims, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
