import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * Encola un mensaje de bienvenida por WhatsApp para el cliente que acaba de pagar (demo barber).
 * El WhatsApp Bridge (scripts/whatsapp-bridge.js) recoge los mensajes de outbound_messages
 * y los envía; aquí insertamos uno con el teléfono como senderId.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim().replace(/\D/g, '') : '';
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere un número de teléfono válido (10+ dígitos)' },
        { status: 400 }
      );
    }

    const baseUrl =
      typeof body.link === 'string' && body.link.trim()
        ? body.link.trim()
        : process.env.NEXT_PUBLIC_APP_URL || (() => {
            try {
              return new URL(request.url).origin;
            } catch {
              return '';
            }
          })();
    const base = baseUrl || 'https://tu-app.onrender.com';
    const link = base.replace(/\/$/, '') + '/dashboard';
    const message = `¡Bienvenido a Agentia! Aquí tienes tu acceso para configurar tu barbería: ${link}`;

    const senderId = phone.includes('@') ? phone : `${phone}@c.us`;

    const db = await getMongoDb();
    await db.collection('outbound_messages').insertOne({
      leadId: 'demo-barber',
      senderId,
      clientId: 'demo',
      message,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al encolar mensaje';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
