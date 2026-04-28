// scripts/stripe-setup.js
// Crea productos y precios en Stripe para los 3 planes de Agentia.
// Uso: STRIPE_SECRET_KEY=sk_... node scripts/stripe-setup.js
//
// Copia las variables de entorno resultantes a tu .env.local / Render.

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });

const PLANES = [
  { key: 'starter',     nombre: 'Agentia Starter',     mxn: 399, usd: 25 },
  { key: 'profesional', nombre: 'Agentia Profesional',  mxn: 599, usd: 35 },
  { key: 'premium',     nombre: 'Agentia Premium',      mxn: 899, usd: 55 },
];

async function main() {
  console.log('Creando productos y precios en Stripe...\n');

  const envLines = [];

  // Activación única MXN
  const actMXN = await stripe.prices.create({
    currency: 'mxn',
    unit_amount: 50000, // $500 MXN
    product_data: { name: 'Activación única Agentia' },
  });
  envLines.push(`STRIPE_PRICE_ACTIVACION_MXN=${actMXN.id}`);
  console.log(`Activación MXN: ${actMXN.id}`);

  // Activación única USD
  const actUSD = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 3000, // $30 USD
    product_data: { name: 'Agentia Activation Fee' },
  });
  envLines.push(`STRIPE_PRICE_ACTIVACION_USD=${actUSD.id}`);
  console.log(`Activación USD: ${actUSD.id}\n`);

  for (const plan of PLANES) {
    // Producto
    const product = await stripe.products.create({
      name: plan.nombre,
      description: `Plan mensual ${plan.nombre} — Agentia CRM + Chatbot IA`,
      metadata: { plan: plan.key },
    });

    // Precio MXN mensual
    const priceMXN = await stripe.prices.create({
      product: product.id,
      currency: 'mxn',
      unit_amount: plan.mxn * 100,
      recurring: { interval: 'month' },
      metadata: { plan: plan.key, moneda: 'mxn' },
    });

    // Precio USD mensual
    const priceUSD = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: plan.usd * 100,
      recurring: { interval: 'month' },
      metadata: { plan: plan.key, moneda: 'usd' },
    });

    const keyUpper = plan.key.toUpperCase();
    envLines.push(`STRIPE_PRICE_${keyUpper}_MXN=${priceMXN.id}`);
    envLines.push(`STRIPE_PRICE_${keyUpper}_USD=${priceUSD.id}`);

    console.log(`${plan.nombre}:`);
    console.log(`  MXN: ${priceMXN.id}`);
    console.log(`  USD: ${priceUSD.id}\n`);
  }

  console.log('──────────────────────────────────────────');
  console.log('Agregar al .env.local / Render:');
  console.log('──────────────────────────────────────────');
  envLines.forEach(l => console.log(l));
}

main().catch(e => { console.error(e); process.exit(1); });
