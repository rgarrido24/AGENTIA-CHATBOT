/**
 * Copia un documento de agentia_clientes → agentia_clients y agrega IDs de Stripe
 * para que el webhook de facturación lo encuentre.
 *
 * Uso:
 *   node scripts/copy-agentia-cliente-to-clients.js --client-id=deco-house --stripe-customer=cus_XXX
 *   node scripts/copy-agentia-cliente-to-clients.js --client-id=deco-house --stripe-customer=cus_XXX --stripe-sub=sub_XXX
 *
 * Requiere MONGODB_URI y opcionalmente MONGODB_DB (.env.local o variables de entorno).
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const pairs = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (v.startsWith('\ufeff')) v = v.slice(1);
    pairs[k] = v;
  }
  return pairs;
}

function argVal(name) {
  const pre = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pre));
  return hit ? hit.slice(pre.length).trim().replace(/^["']|["']$/g, '') : '';
}

async function main() {
  const clientIdArg = argVal('client-id');
  const stripeCustomer = argVal('stripe-customer');
  const stripeSub = argVal('stripe-sub');

  if (!clientIdArg || !stripeCustomer) {
    console.error('Uso: node scripts/copy-agentia-cliente-to-clients.js --client-id=... --stripe-customer=cus_... [--stripe-sub=sub_...]');
    process.exit(1);
  }

  const root = path.join(__dirname, '..');
  const env = {
    ...loadEnvFile(path.join(root, '.env')),
    ...loadEnvFile(path.join(root, '.env.local')),
    ...process.env,
  };
  const uri = env.MONGODB_URI;
  const dbName = (env.MONGODB_DB || 'agentia_chatbot_ventas').trim();
  if (!uri) {
    console.error('Falta MONGODB_URI');
    process.exit(1);
  }

  const mc = new MongoClient(uri);
  await mc.connect();
  try {
    const db = mc.db(dbName);
    const legacy = await db.collection('agentia_clientes').findOne({ clientId: clientIdArg });
    if (!legacy) {
      console.error(`No hay documento en agentia_clientes con clientId="${clientIdArg}"`);
      process.exit(1);
    }

    const now = new Date();
    const doc = {
      clientId: String(legacy.clientId || clientIdArg),
      nombre: legacy.nombre,
      negocio: legacy.negocio,
      giro: legacy.giro,
      pais: legacy.pais,
      telefono: legacy.telefono,
      email: legacy.email,
      plan: legacy.plan,
      moneda: legacy.moneda,
      status: legacy.status || 'activo',
      fechaInicio: legacy.fechaInicio || legacy.createdAt || now,
      proximoPago: legacy.proximoPago || null,
      notas: legacy.notas,
      precio: legacy.precio,
      stripeCustomerId: stripeCustomer,
      ...(stripeSub ? { stripeSubscriptionId: stripeSub } : {}),
      termsAcceptedAt: legacy.termsAcceptedAt || legacy.createdAt || now,
      createdAt: legacy.createdAt || now,
      updatedAt: now,
      migratedFrom: 'agentia_clientes',
      migratedAt: now,
    };

    await db.collection('agentia_clients').updateOne(
      { stripeCustomerId: stripeCustomer },
      {
        $set: { ...doc, updatedAt: now },
        $setOnInsert: { createdAt: legacy.createdAt || now },
      },
      { upsert: true }
    );

    console.log(`Listo: agentia_clients actualizado/insertado para stripeCustomerId=${stripeCustomer} (clientId ${doc.clientId})`);
    console.log('Puedes borrar el duplicado en agentia_clientes desde Atlas si ya no lo necesitas.');
  } finally {
    await mc.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
