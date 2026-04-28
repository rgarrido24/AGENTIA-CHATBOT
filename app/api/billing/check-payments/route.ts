import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Called daily by whatsapp-bridge on day 6 of each month.
// Suspends clients whose proximoPago is overdue and enqueues WhatsApp notifications.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getMongoDb();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Find active clients whose payment date has passed
  const overdueClients = await db
    .collection('agentia_clients')
    .find({
      status: 'activo',
      proximoPago: { $lt: new Date(todayStr) },
    })
    .toArray();

  if (overdueClients.length === 0) {
    return NextResponse.json({ suspended: 0, message: 'Sin clientes vencidos' });
  }

  const results: string[] = [];

  for (const cliente of overdueClients) {
    // Suspend the client
    await db.collection('agentia_clients').updateOne(
      { _id: cliente._id },
      { $set: { status: 'suspendido', suspendedAt: now } }
    );

    // Notify client via WhatsApp if they have a phone number
    if (cliente.telefono) {
      const phone = String(cliente.telefono).replace(/\D/g, '');
      const msg =
        `⚠️ *Agentia* — Tu suscripción ha sido suspendida por falta de pago.\n\n` +
        `Para reactivar tu servicio, contáctanos:\n` +
        `📩 hola@agentia.software\n` +
        `💬 https://wa.me/529998080265`;

      await db.collection('outbound_messages').insertOne({
        senderId: `${phone}@c.us`,
        message: msg,
        clientId: 'agentia-ventas',
        source: 'billing-cron',
        createdAt: now,
        sent: false,
      });
    }

    // Notify admin
    const adminPhone = process.env.ALERT_WHATSAPP_NUMBER?.replace(/\D/g, '');
    if (adminPhone) {
      const adminMsg =
        `🔴 *Agentia Billing* — Cliente suspendido por falta de pago:\n` +
        `*${cliente.negocio ?? cliente.nombre}*\n` +
        `Plan: ${cliente.plan} · ${cliente.moneda?.toUpperCase()}\n` +
        `Vencimiento: ${cliente.proximoPago ? new Date(cliente.proximoPago).toLocaleDateString('es-MX') : '-'}`;

      await db.collection('outbound_messages').insertOne({
        senderId: `${adminPhone}@c.us`,
        message: adminMsg,
        clientId: 'agentia-ventas',
        source: 'billing-cron-admin',
        createdAt: now,
        sent: false,
      });
    }

    results.push(cliente.negocio ?? cliente._id.toString());
  }

  return NextResponse.json({ suspended: results.length, clients: results });
}
