import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getMongoDb } from '@/lib/mongodb';
import type Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function nextBillingDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function alertRodolfo(db: Awaited<ReturnType<typeof getMongoDb>>, message: string) {
  const to = process.env.RODOLFO_WHATSAPP;
  if (!to) return;
  await db.collection('outbound_messages').insertOne({
    senderId: to, clientId: 'agentia-admin', message, createdAt: new Date(),
  });
}

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('[stripe/webhook] signature error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = await getMongoDb();

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = (session.metadata ?? {}) as Record<string, string>;
      const { plan, moneda, negocio, nombre, giro, pais, telefono, email } = meta;
      const clientId = slugify(negocio || nombre || `cliente-${Date.now()}`);

      await db.collection('agentia_clients').updateOne(
        { stripeCustomerId: session.customer as string },
        {
          $set: {
            clientId,
            nombre, negocio, giro, pais, telefono, email,
            plan, moneda,
            stripeCustomerId:    session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status:      'activo',
            proximoPago: nextBillingDate(),
            termsAcceptedAt: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: { fechaInicio: new Date(), createdAt: new Date() },
        },
        { upsert: true }
      );

      await alertRodolfo(db,
        `🎉 NUEVO CLIENTE AGENTIA\n\nNegocio: ${negocio}\nPlan: ${plan?.toUpperCase()} (${moneda?.toUpperCase()})\nGiro: ${giro}\nPaís: ${pais}\nWhatsApp: ${telefono}\nEmail: ${email}`
      );
      console.log(`[stripe/webhook] checkout.session.completed: ${clientId}`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';
      await db.collection('agentia_clients').updateOne(
        { stripeCustomerId: customerId },
        {
          $set:  { proximoPago: nextBillingDate(), status: 'activo', updatedAt: new Date() },
          $push: { pagos: { fecha: new Date(), monto: invoice.amount_paid / 100, moneda: invoice.currency } } as never,
        }
      );
      console.log(`[stripe/webhook] invoice.payment_succeeded: ${customerId}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';
      const client = await db.collection('agentia_clients').findOne({ stripeCustomerId: customerId });

      await alertRodolfo(db,
        `⚠️ PAGO FALLIDO\n\nCliente: ${client?.negocio ?? customerId}\nMonto: $${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}`
      );

      if (client?.telefono) {
        await db.collection('outbound_messages').insertOne({
          senderId: String(client.telefono),
          clientId: String(client.clientId ?? 'agentia-admin'),
          message:  `⚠️ Hola ${client.nombre ?? ''}, tu pago de Agentia no pudo procesarse. Por favor actualiza tu método de pago en agentia.software para no perder el servicio.`,
          createdAt: new Date(),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? '';
      const client = await db.collection('agentia_clients').findOneAndUpdate(
        { stripeCustomerId: customerId },
        { $set: { status: 'cancelado', updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (client?.telefono) {
        await db.collection('outbound_messages').insertOne({
          senderId: String(client.telefono),
          clientId: String(client.clientId ?? 'agentia-admin'),
          message:  `Tu suscripción a Agentia ha sido cancelada. Si fue un error, escríbenos a agentia.software.`,
          createdAt: new Date(),
        });
      }
      await alertRodolfo(db, `❌ Suscripción cancelada: ${client?.negocio ?? customerId}`);
      break;
    }

    default:
      console.log(`[stripe/webhook] evento ignorado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
